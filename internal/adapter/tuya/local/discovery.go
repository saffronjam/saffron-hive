package local

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"net"
	"sync"
	"syscall"
	"time"
)

// udpBroadcastKey is the well-known key Tuya uses to encrypt v3.3+ discovery
// broadcasts on UDP 6667 (md5 of a fixed string).
var udpBroadcastKey = func() []byte { h := md5.Sum([]byte("yGAdlopoPVldABfn")); return h[:] }()

// Discovered is a device seen on the LAN via UDP broadcast.
type Discovered struct {
	GwID    string
	IP      string
	Version string
}

// soReusePort is SO_REUSEPORT on Linux (the deploy target); not exported by the
// stdlib syscall package on all platforms.
const soReusePort = 0x0F

// reuseControl sets SO_REUSEADDR/SO_REUSEPORT so the discovery listener can
// co-bind the broadcast ports alongside other consumers (e.g. the Tuya app).
func reuseControl(_, _ string, c syscall.RawConn) error {
	var serr error
	if err := c.Control(func(fd uintptr) {
		if e := syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, syscall.SO_REUSEADDR, 1); e != nil {
			serr = e
			return
		}
		serr = syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, soReusePort, 1)
	}); err != nil {
		return err
	}
	return serr
}

// Discover listens for Tuya UDP broadcasts on ports 6666 (plaintext) and 6667
// (encrypted) for the given duration and returns the devices seen, keyed by
// gateway id. Ports that cannot be bound are skipped.
func Discover(ctx context.Context, dur time.Duration) map[string]Discovered {
	lc := net.ListenConfig{Control: reuseControl}
	out := map[string]Discovered{}
	var mu sync.Mutex
	var wg sync.WaitGroup
	deadline := time.Now().Add(dur)

	for _, addr := range []string{":6666", ":6667"} {
		pc, err := lc.ListenPacket(ctx, "udp4", addr)
		if err != nil {
			continue
		}
		wg.Add(1)
		go func(pc net.PacketConn) {
			defer wg.Done()
			defer func() { _ = pc.Close() }()
			buf := make([]byte, 2048)
			for {
				_ = pc.SetReadDeadline(deadline)
				n, _, err := pc.ReadFrom(buf)
				if n > 0 {
					if d, ok := parseBroadcast(buf[:n]); ok {
						mu.Lock()
						out[d.GwID] = d
						mu.Unlock()
					}
				}
				if err != nil || time.Now().After(deadline) {
					return
				}
			}
		}(pc)
	}
	wg.Wait()
	return out
}

func parseBroadcast(data []byte) (Discovered, bool) {
	msg, _, err := decodeFrame(data, nil)
	if err != nil {
		return Discovered{}, false
	}
	var b struct {
		IP      string `json:"ip"`
		GwID    string `json:"gwId"`
		Version string `json:"version"`
	}
	if json.Unmarshal(msg.payload, &b) != nil {
		plain, derr := aesECBDecrypt(udpBroadcastKey, msg.payload)
		if derr != nil || json.Unmarshal(plain, &b) != nil {
			return Discovered{}, false
		}
	}
	if b.GwID == "" || b.IP == "" {
		return Discovered{}, false
	}
	return Discovered{GwID: b.GwID, IP: b.IP, Version: b.Version}, true
}
