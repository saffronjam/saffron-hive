package local

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net"
	"strconv"
	"time"
)

const port = "6668"

// versionHeader is the 15-byte prefix (3-char version + 12 zero bytes) that
// v3.3+ prepend to CONTROL payloads and to some device responses.
func versionHeader(version string) []byte {
	h := make([]byte, 15)
	copy(h, version)
	return h
}

// Device is a single Tuya device reachable over the LAN. Not safe for
// concurrent use; the adapter owns one per device and serializes access.
type Device struct {
	ID       string
	version  string // "3.3" / "3.4"
	addr     string
	localKey []byte

	conn       net.Conn
	sessionKey []byte
	seq        uint32
}

// NewDevice builds a client for a device at ip using its local key and LAN
// protocol version (e.g. "3.3", "3.4").
func NewDevice(id, ip, localKey, version string) *Device {
	return &Device{
		ID:       id,
		version:  version,
		addr:     net.JoinHostPort(ip, port),
		localKey: []byte(localKey),
	}
}

func (d *Device) isV34() bool { return d.version >= "3.4" }

// cryptoKey is the AES/HMAC key for the current phase: the local key during the
// v3.4 handshake (before sessionKey is set), the session key afterwards, and
// always the local key for v3.3.
func (d *Device) cryptoKey() []byte {
	if d.sessionKey != nil {
		return d.sessionKey
	}
	return d.localKey
}

// hmacKey returns the frame trailer key: the crypto key for v3.4 (HMAC trailer),
// nil for v3.3 (CRC32 trailer).
func (d *Device) hmacKey() []byte {
	if d.isV34() {
		return d.cryptoKey()
	}
	return nil
}

func (d *Device) nextSeq() uint32 { d.seq++; return d.seq }

// Connect dials the device and performs the v3.4 session handshake when needed.
func (d *Device) Connect(timeout time.Duration) error {
	conn, err := net.DialTimeout("tcp", d.addr, timeout)
	if err != nil {
		return fmt.Errorf("dial %s: %w", d.addr, err)
	}
	d.conn = conn
	if d.isV34() {
		if err := d.negotiate(timeout); err != nil {
			_ = d.Close()
			return fmt.Errorf("v3.4 handshake: %w", err)
		}
	}
	return nil
}

// Close releases the connection.
func (d *Device) Close() error {
	if d.conn == nil {
		return nil
	}
	err := d.conn.Close()
	d.conn = nil
	d.sessionKey = nil
	return err
}

func (d *Device) negotiate(timeout time.Duration) error {
	start, err := aesECBEncrypt(d.localKey, localNonce)
	if err != nil {
		return err
	}
	if err := d.writeFrame(cmdSessKeyNegStart, start); err != nil {
		return err
	}
	resp, err := d.readFrame(timeout)
	if err != nil {
		return fmt.Errorf("read neg resp: %w", err)
	}
	plain, err := aesECBDecrypt(d.localKey, resp.payload)
	if err != nil {
		return fmt.Errorf("decrypt neg resp: %w", err)
	}
	if len(plain) < 48 {
		return fmt.Errorf("neg resp too short: %d", len(plain))
	}
	remoteNonce := plain[:16]
	mac := hmac.New(sha256.New, d.localKey)
	mac.Write(localNonce)
	if !hmac.Equal(plain[16:48], mac.Sum(nil)) {
		return fmt.Errorf("neg resp hmac mismatch")
	}

	fin := hmac.New(sha256.New, d.localKey)
	fin.Write(remoteNonce)
	finishEnc, err := aesECBEncrypt(d.localKey, fin.Sum(nil))
	if err != nil {
		return err
	}
	if err := d.writeFrame(cmdSessKeyNegFinish, finishEnc); err != nil {
		return err
	}
	sk, err := deriveSessionKey(d.localKey, localNonce, remoteNonce)
	if err != nil {
		return err
	}
	d.sessionKey = sk
	return nil
}

func (d *Device) statusRequest() (uint32, []byte) {
	if d.isV34() {
		return cmdDPQueryNew, []byte("{}")
	}
	return cmdDPQuery, fmt.Appendf(nil, `{"gwId":%q,"devId":%q,"uid":%q,"t":%q}`,
		d.ID, d.ID, d.ID, strconv.FormatInt(time.Now().Unix(), 10))
}

func (d *Device) controlRequest(dps map[string]any) (uint32, []byte) {
	if d.isV34() {
		inner, _ := json.Marshal(map[string]any{
			"protocol": 5,
			"t":        time.Now().Unix(),
			"data":     map[string]any{"dps": dps},
		})
		return cmdControlNew, append(versionHeader(d.version), inner...)
	}
	body, _ := json.Marshal(map[string]any{
		"devId": d.ID, "uid": d.ID, "t": time.Now().Unix(), "dps": dps,
	})
	return cmdControl, append(versionHeader(d.version), body...)
}

func (d *Device) sendEncrypted(command uint32, plain []byte) error {
	enc, err := aesECBEncrypt(d.cryptoKey(), plain)
	if err != nil {
		return err
	}
	return d.writeFrame(command, enc)
}

// SendStatusQuery writes a status request without waiting for the reply (the
// reply arrives via ReadMessage on the read loop).
func (d *Device) SendStatusQuery() error {
	cmd, payload := d.statusRequest()
	return d.sendEncrypted(cmd, payload)
}

// SendControl writes a CONTROL command setting the given data points.
func (d *Device) SendControl(dps map[string]any) error {
	cmd, plain := d.controlRequest(dps)
	return d.sendEncrypted(cmd, plain)
}

// SendHeartbeat writes a heartbeat to keep the connection alive.
func (d *Device) SendHeartbeat() error {
	return d.sendEncrypted(cmdHeartbeat, []byte("{}"))
}

// ReadMessage reads one frame and returns its data points, or nil for frames
// that carry none (e.g. heartbeat acks). Intended for a dedicated read loop;
// safe to run concurrently with the Send* writers on the same connection.
func (d *Device) ReadMessage(timeout time.Duration) (map[string]any, error) {
	msg, err := d.readFrame(timeout)
	if err != nil {
		return nil, err
	}
	if len(msg.payload) == 0 {
		return nil, nil
	}
	plain, err := aesECBDecrypt(d.cryptoKey(), msg.payload)
	if err != nil {
		return nil, nil
	}
	return extractDPS(stripVersionHeader(plain)), nil
}

// Status queries the device and waits for the reply (one-shot; not for use
// alongside a read loop).
func (d *Device) Status(timeout time.Duration) (map[string]any, error) {
	if err := d.SendStatusQuery(); err != nil {
		return nil, err
	}
	return d.readDPS(timeout)
}

// SetValues sends a CONTROL command and consumes the ack (one-shot).
func (d *Device) SetValues(dps map[string]any, timeout time.Duration) error {
	if err := d.SendControl(dps); err != nil {
		return err
	}
	_, _ = d.readDPS(timeout)
	return nil
}

func (d *Device) writeFrame(command uint32, payload []byte) error {
	frame := encodeFrame(d.nextSeq(), command, payload, d.hmacKey())
	_ = d.conn.SetWriteDeadline(time.Now().Add(8 * time.Second))
	_, err := d.conn.Write(frame)
	return err
}

func (d *Device) readFrame(timeout time.Duration) (message, error) {
	_ = d.conn.SetReadDeadline(time.Now().Add(timeout))
	buf := make([]byte, 0, 1024)
	tmp := make([]byte, 1024)
	for {
		n, err := d.conn.Read(tmp)
		if n > 0 {
			buf = append(buf, tmp[:n]...)
			msg, _, derr := decodeFrame(buf, d.hmacKey())
			if derr == nil {
				return msg, nil
			}
			if derr != errShortFrame {
				return message{}, derr
			}
		}
		if err != nil {
			return message{}, err
		}
	}
}

// readDPS reads frames until one decrypts to a JSON object containing dps.
func (d *Device) readDPS(timeout time.Duration) (map[string]any, error) {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		msg, err := d.readFrame(time.Until(deadline))
		if err != nil {
			return nil, err
		}
		if len(msg.payload) == 0 {
			continue
		}
		plain, err := aesECBDecrypt(d.cryptoKey(), msg.payload)
		if err != nil {
			continue
		}
		plain = stripVersionHeader(plain)
		dps := extractDPS(plain)
		if dps != nil {
			return dps, nil
		}
	}
	return nil, fmt.Errorf("no dps in response")
}

func stripVersionHeader(p []byte) []byte {
	if len(p) >= 15 && (bytes.HasPrefix(p, []byte("3.3")) || bytes.HasPrefix(p, []byte("3.4")) || bytes.HasPrefix(p, []byte("3.5"))) {
		return p[15:]
	}
	return p
}

// extractDPS pulls the dps map from a decoded payload, handling both the flat
// {"dps":{...}} shape and the wrapped {"data":{"dps":{...}}} shape.
func extractDPS(plain []byte) map[string]any {
	var env struct {
		Dps  map[string]any `json:"dps"`
		Data struct {
			Dps map[string]any `json:"dps"`
		} `json:"data"`
	}
	if err := json.Unmarshal(plain, &env); err != nil {
		return nil
	}
	if env.Dps != nil {
		return env.Dps
	}
	if env.Data.Dps != nil {
		return env.Data.Dps
	}
	return nil
}
