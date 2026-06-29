package local

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"hash/crc32"
)

const (
	prefix uint32 = 0x000055AA
	suffix uint32 = 0x0000AA55
)

// Tuya LAN command codes (subset used by this client).
const (
	cmdControl          uint32 = 0x07
	cmdStatus           uint32 = 0x08 // unsolicited DP report (push)
	cmdHeartbeat        uint32 = 0x09
	cmdDPQuery          uint32 = 0x0a
	cmdControlNew       uint32 = 0x0d
	cmdDPQueryNew       uint32 = 0x10
	cmdSessKeyNegStart  uint32 = 0x03
	cmdSessKeyNegResp   uint32 = 0x04
	cmdSessKeyNegFinish uint32 = 0x05
)

// message is a decoded Tuya LAN frame.
type message struct {
	seq     uint32
	command uint32
	payload []byte // frame payload with any leading return code stripped
}

// encodeFrame builds a Tuya LAN frame. When hmacKey is non-nil the frame uses
// the v3.4 HMAC-SHA256 trailer; otherwise it uses the v3.3 CRC32 trailer.
func encodeFrame(seq, command uint32, payload, hmacKey []byte) []byte {
	checksumLen := 4
	if hmacKey != nil {
		checksumLen = 32
	}
	length := uint32(len(payload) + checksumLen + 4) // checksum + suffix

	buf := make([]byte, 16+len(payload))
	binary.BigEndian.PutUint32(buf[0:], prefix)
	binary.BigEndian.PutUint32(buf[4:], seq)
	binary.BigEndian.PutUint32(buf[8:], command)
	binary.BigEndian.PutUint32(buf[12:], length)
	copy(buf[16:], payload)

	if hmacKey != nil {
		mac := hmac.New(sha256.New, hmacKey)
		mac.Write(buf)
		buf = mac.Sum(buf)
	} else {
		buf = binary.BigEndian.AppendUint32(buf, crc32.ChecksumIEEE(buf))
	}
	return binary.BigEndian.AppendUint32(buf, suffix)
}

// decodeFrame parses a single Tuya LAN frame from the front of data and returns
// the decoded message plus the number of bytes consumed. hmacKey selects the
// trailer type (must match the peer). Responses carry a 4-byte return code at
// the head of the payload, which is stripped.
func decodeFrame(data, hmacKey []byte) (message, int, error) {
	if len(data) < 20 {
		return message{}, 0, errShortFrame
	}
	if binary.BigEndian.Uint32(data[0:]) != prefix {
		return message{}, 0, fmt.Errorf("bad prefix")
	}
	seq := binary.BigEndian.Uint32(data[4:])
	command := binary.BigEndian.Uint32(data[8:])
	length := int(binary.BigEndian.Uint32(data[12:]))
	total := 16 + length
	if len(data) < total {
		return message{}, 0, errShortFrame
	}
	if binary.BigEndian.Uint32(data[total-4:total]) != suffix {
		return message{}, 0, fmt.Errorf("bad suffix")
	}

	checksumLen := 4
	if hmacKey != nil {
		checksumLen = 32
	}
	bodyEnd := total - 4 - checksumLen
	if bodyEnd < 16 {
		return message{}, 0, fmt.Errorf("frame too small for checksum")
	}
	got := data[bodyEnd : total-4]
	if hmacKey != nil {
		mac := hmac.New(sha256.New, hmacKey)
		mac.Write(data[:bodyEnd])
		if !hmac.Equal(got, mac.Sum(nil)) {
			return message{}, 0, fmt.Errorf("hmac mismatch")
		}
	} else {
		if binary.BigEndian.Uint32(got) != crc32.ChecksumIEEE(data[:bodyEnd]) {
			return message{}, 0, fmt.Errorf("crc mismatch")
		}
	}

	payload := data[16:bodyEnd]
	// Response frames prepend a 4-byte return code (a small integer) before the
	// body. Strip it when the leading word looks like a return code, matching
	// the reference implementation's heuristic.
	if len(payload) >= 4 && binary.BigEndian.Uint32(payload[:4]) < 0x100 {
		payload = payload[4:]
	}
	return message{seq: seq, command: command, payload: payload}, total, nil
}

var errShortFrame = fmt.Errorf("short frame")
