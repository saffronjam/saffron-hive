package local

import (
	"encoding/binary"
	"testing"
)

func TestParseBroadcastEncrypted(t *testing.T) {
	body := []byte(`{"ip":"192.168.1.37","gwId":"abc123","version":"3.4"}`)
	enc, err := aesECBEncrypt(udpBroadcastKey, body)
	if err != nil {
		t.Fatal(err)
	}
	// Broadcasts carry a leading 4-byte return code before the encrypted body.
	payload := append(binary.BigEndian.AppendUint32(nil, 0), enc...)
	frame := encodeFrame(0, 19, payload, nil)

	d, ok := parseBroadcast(frame)
	if !ok {
		t.Fatal("parseBroadcast failed")
	}
	if d.GwID != "abc123" || d.IP != "192.168.1.37" || d.Version != "3.4" {
		t.Fatalf("got %+v", d)
	}
}

func TestParseBroadcastPlaintext(t *testing.T) {
	body := []byte(`{"ip":"10.0.0.5","gwId":"plain1","version":"3.1"}`)
	frame := encodeFrame(0, 19, body, nil)
	d, ok := parseBroadcast(frame)
	if !ok || d.GwID != "plain1" || d.IP != "10.0.0.5" {
		t.Fatalf("plaintext parse: %+v ok=%v", d, ok)
	}
}
