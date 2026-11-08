package cleaning

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"sort"
	"time"
)

// MapPoint is a position in the vacuum's world coordinates, measured in millimetres.
type MapPoint struct {
	X float64
	Y float64
}

// MapPosition adds the reported heading in degrees to a map position.
type MapPosition struct {
	X     float64
	Y     float64
	Angle float64
}

// MapLayer contains horizontal pixel runs encoded as an SVG path in image coordinates.
type MapLayer struct {
	Kind   string
	RoomID int
	Path   string
}

// MapRoom describes a room and a label position inside its floor area.
type MapRoom struct {
	ID   int
	Name string
	X    float64
	Y    float64
	Area float64
}

// MapArea is a reported no-go or no-mop polygon in world coordinates.
type MapArea struct {
	Kind   string
	Points []MapPoint
}

// MapSnapshot is a decoded full map frame. Pixel paths use a top-left image origin.
type MapSnapshot struct {
	FrameAt    *time.Time
	ID         int
	SavedMapID int
	Revision   string
	Name       string
	Width      int
	Height     int
	GridSize   int
	Left       int
	Top        int
	Rotation   float64
	Robot      *MapPosition
	Dock       *MapPosition
	Layers     []MapLayer
	Rooms      []MapRoom
	Areas      []MapArea
	Walls      [][]MapPoint
	Path       []MapPoint
}

// MapRevision fingerprints structural geometry, excluding names and live positions.
func MapRevision(m MapSnapshot) string {
	layers := append([]MapLayer(nil), m.Layers...)
	sort.Slice(layers, func(i, j int) bool {
		if layers[i].Kind == layers[j].Kind {
			return layers[i].RoomID < layers[j].RoomID
		}
		return layers[i].Kind < layers[j].Kind
	})
	raw, _ := json.Marshal(struct {
		ID, Width, Height, GridSize, Left, Top int
		Layers                                 []MapLayer
	}{m.ID, m.Width, m.Height, m.GridSize, m.Left, m.Top, layers})
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:])
}
