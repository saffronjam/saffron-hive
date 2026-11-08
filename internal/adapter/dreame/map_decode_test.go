package dreame

import (
	"bytes"
	"compress/zlib"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"strings"
	"testing"
)

func mapFixture(t *testing.T, width, height int, pixels []byte, tail string) string {
	t.Helper()
	header := make([]byte, 27)
	for offset, value := range map[int]int{0: 7, 2: 12, 5: 0, 7: 250, 9: 90, 11: 32767, 13: 32767, 15: 32767, 17: 50, 19: width, 21: height, 23: -100, 25: 200} {
		binary.LittleEndian.PutUint16(header[offset:offset+2], uint16(value))
	}
	header[4] = 'I'
	var compressed bytes.Buffer
	writer := zlib.NewWriter(&compressed)
	if _, err := writer.Write(append(append(header, pixels...), []byte(tail)...)); err != nil {
		t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	return base64.RawURLEncoding.EncodeToString(compressed.Bytes())
}

func TestDecodeSavedMapPreservesRoomsAndCoordinates(t *testing.T) {
	encoded := mapFixture(t, 3, 2, []byte{1, 1, 128, 2, 2, 128}, `{"seg_inf":{"1":{"name":"S2l0Y2hlbg=="},"2":{"name":"U292cnVt"}},"vw":{"rect":[[-100,200,0,250]],"line":[[-100,200,0,250]]},"tr":"S0,250L50,0"}`)
	m, err := decodeMap(encoded, 90)
	if err != nil {
		t.Fatal(err)
	}
	if m.ID != 7 || m.Width != 3 || m.Height != 2 || m.Left != -100 || m.Top != 200 || m.GridSize != 50 || m.Rotation != 90 {
		t.Fatalf("wrong image coordinates: %+v", m)
	}
	if m.Robot == nil || m.Robot.X != 0 || m.Robot.Y != 250 || m.Dock != nil {
		t.Fatal("position or absence sentinel was lost")
	}
	if len(m.Rooms) != 2 || m.Rooms[0].Name != "Kitchen" || m.Rooms[1].Name != "Sovrum" || m.Rooms[0].Area != 0.005 {
		t.Fatalf("wrong room metadata: %+v", m.Rooms)
	}
	if m.Layers[0].Path != "M0 1h2v1h-2z" || m.Layers[1].Path != "M0 0h2v1h-2z" {
		t.Fatalf("floor plan is inverted or distorted: %+v", m.Layers)
	}
	if len(m.Areas) != 1 || len(m.Walls) != 1 || len(m.Path) != 2 || m.Path[1].X != 50 || m.Path[1].Y != 250 {
		t.Fatal("map geometry or relative path was lost")
	}
}

func TestDecodeSavedMapRejectsTruncatedAndPartialFrames(t *testing.T) {
	for _, encoded := range []string{"not base64", base64.StdEncoding.EncodeToString([]byte("invalid zlib")), mapFixture(t, 4, 4, []byte{1}, ""), mapFixture(t, 4096, 4096, nil, "")} {
		if _, err := decodeMap(encoded, 0); err == nil {
			t.Fatal("malformed map was accepted")
		}
	}
	encoded := mapFixture(t, 1, 1, []byte{1}, `{}`) + ",private-map-key"
	if _, err := decodeMap(encoded, 0); err == nil || strings.Contains(err.Error(), "private-map-key") {
		t.Fatal("encrypted map was accepted or its key was exposed")
	}
}

func TestDecodeSavedMapFramePixelsAndHiddenPositions(t *testing.T) {
	encoded := mapFixture(t, 3, 1, []byte{4, 8, 252}, `{"fsm":1,"nr":true}`)
	m, err := decodeMap(encoded, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(m.Rooms) != 2 || m.Rooms[0].ID != 1 || m.Rooms[1].ID != 2 || m.Layers[2].Kind != "wall" || m.Robot != nil {
		t.Fatalf("frame-map decoding failed: %+v", m)
	}
}

func TestDecodeMapCatalogueIsolatesInvalidMap(t *testing.T) {
	encoded := mapFixture(t, 2, 1, []byte{1, 2}, `{}`)
	data, _ := json.Marshal(map[string]any{"mapstr": []map[string]any{{"name": "First floor", "angle": "90", "map": encoded}, {"name": "Broken floor", "map": "invalid"}}})
	c := newClient(nil, "", "owner@example.com")
	d := DeviceReport{ID: "robot"}
	c.decodeCatalogue(t.Context(), &d, data, "eu")
	if len(d.Maps) != 1 || d.Maps[0].Name != "First floor" || d.Maps[0].Rotation != 90 {
		t.Fatalf("valid saved map was not decoded: %+v", d.Maps)
	}
	if len(d.Reads) != 1 || d.Reads[0].Error == nil {
		t.Fatal("bad map failure was not isolated")
	}
}
