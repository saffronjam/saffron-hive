package local

import (
	"bytes"
	"encoding/binary"
	"testing"
)

func TestEncodeDecodeCRC(t *testing.T) {
	payload := []byte(`{"dps":{"1":true}}`)
	frame := encodeFrame(7, cmdSessKeyNegStart, payload, nil)
	msg, n, err := decodeFrame(frame, nil)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if n != len(frame) {
		t.Fatalf("consumed %d, want %d", n, len(frame))
	}
	if msg.seq != 7 || msg.command != cmdSessKeyNegStart {
		t.Fatalf("header mismatch: %+v", msg)
	}
	if !bytes.Equal(msg.payload, payload) {
		t.Fatalf("payload = %q, want %q", msg.payload, payload)
	}
}

func TestEncodeDecodeHMAC(t *testing.T) {
	key := bytes.Repeat([]byte{0x11}, 16)
	payload := []byte("hello-v34")
	frame := encodeFrame(1, cmdSessKeyNegStart, payload, key)
	msg, _, err := decodeFrame(frame, key)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !bytes.Equal(msg.payload, payload) {
		t.Fatalf("payload = %q, want %q", msg.payload, payload)
	}
	// Wrong key must fail the HMAC check.
	if _, _, err := decodeFrame(frame, bytes.Repeat([]byte{0x22}, 16)); err == nil {
		t.Fatal("expected hmac mismatch with wrong key")
	}
}

func TestDecodeStripsResponseRetcode(t *testing.T) {
	body := []byte(`{"dps":{"110":true}}`)
	withRet := append(binary.BigEndian.AppendUint32(nil, 0), body...)
	frame := encodeFrame(3, cmdDPQuery, withRet, nil) // DP_QUERY is a response code
	msg, _, err := decodeFrame(frame, nil)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !bytes.Equal(msg.payload, body) {
		t.Fatalf("payload = %q, want retcode stripped %q", msg.payload, body)
	}
}

func TestDecodeShortFrame(t *testing.T) {
	if _, _, err := decodeFrame([]byte{0x00, 0x00}, nil); err != errShortFrame {
		t.Fatalf("err = %v, want errShortFrame", err)
	}
}
