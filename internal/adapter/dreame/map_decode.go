package dreame

import (
	"bytes"
	"compress/zlib"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"io"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"unicode/utf8"
)

type mapTail struct {
	Origin      []int           `json:"origin"`
	Rotation    json.Number     `json:"mra"`
	NoRobot     json.RawMessage `json:"nr"`
	NoCharger   json.RawMessage `json:"nc"`
	FrameMap    json.RawMessage `json:"fsm"`
	SavedStatus json.RawMessage `json:"ris"`
	SaveMapID   json.RawMessage `json:"saveMapId"`
	EmbeddedMap string          `json:"rism"`
	Trace       string          `json:"tr"`
	Segments    map[string]struct {
		Name string `json:"name"`
	} `json:"seg_inf"`
	VirtualWalls struct {
		Lines [][]float64 `json:"line"`
		NoGo  [][]float64 `json:"rect"`
		NoMop [][]float64 `json:"mop"`
	} `json:"vw"`
}

type roomPixels struct {
	count    int
	sumX     int64
	sumY     int64
	labelX   int
	labelY   int
	distance float64
}

func decodeMap(encoded string, rotation float64) (cleaning.MapSnapshot, error) {
	return decodeMapFrame(encoded, rotation, 0)
}

func decodeMapFrame(encoded string, rotation float64, depth int) (cleaning.MapSnapshot, error) {
	if depth > 2 {
		return cleaning.MapSnapshot{}, errors.New("saved map nesting exceeds the supported depth")
	}
	encoded = strings.TrimSpace(encoded)
	if strings.Contains(encoded, ",") {
		return cleaning.MapSnapshot{}, errors.New("this map is encrypted and requires a device-specific decryption key")
	}
	encoded = strings.NewReplacer("-", "+", "_", "/", "\r", "", "\n", "").Replace(encoded)
	compressed, err := base64.StdEncoding.DecodeString(encoded + strings.Repeat("=", (4-len(encoded)%4)%4))
	if err != nil {
		return cleaning.MapSnapshot{}, errors.New("saved map is not valid base64")
	}
	reader, err := zlib.NewReader(bytes.NewReader(compressed))
	if err != nil {
		return cleaning.MapSnapshot{}, errors.New("saved map is not a supported zlib stream")
	}
	defer func() { _ = reader.Close() }()
	raw, err := io.ReadAll(io.LimitReader(reader, (16<<20)+1))
	if err != nil || len(raw) > 16<<20 {
		return cleaning.MapSnapshot{}, errors.New("saved map decompression failed or exceeds 16 MiB")
	}
	if len(raw) < 27 {
		return cleaning.MapSnapshot{}, errors.New("saved map header is incomplete")
	}
	if raw[4] != 'I' {
		return cleaning.MapSnapshot{}, errors.New("saved map does not contain a complete image frame")
	}
	readInt := func(offset int) int { return int(int16(binary.LittleEndian.Uint16(raw[offset : offset+2]))) }
	width, height, grid := readInt(19), readInt(21), readInt(17)
	if width < 0 || height < 0 || width > 4096 || height > 4096 || width*height > 4<<20 || grid <= 0 {
		return cleaning.MapSnapshot{}, errors.New("saved map dimensions are invalid")
	}
	end := 27 + width*height
	if end > len(raw) {
		return cleaning.MapSnapshot{}, errors.New("saved map pixel grid is incomplete")
	}
	var tail mapTail
	metadata := bytes.Trim(raw[end:], "\x00 \r\n\t")
	if len(metadata) > 0 {
		if err := json.Unmarshal(metadata, &tail); err != nil {
			return cleaning.MapSnapshot{}, errors.New("saved map metadata could not be decoded")
		}
	}
	m := cleaning.MapSnapshot{ID: readInt(0), Width: width, Height: height, GridSize: grid, Left: readInt(23), Top: readInt(25), Rotation: rotation, Layers: []cleaning.MapLayer{}, Rooms: []cleaning.MapRoom{}, Areas: []cleaning.MapArea{}, Walls: [][]cleaning.MapPoint{}, Path: []cleaning.MapPoint{}}
	if len(tail.Origin) >= 2 {
		m.Left, m.Top = tail.Origin[0], tail.Origin[1]
	}
	if tail.Rotation != "" {
		if v, err := tail.Rotation.Float64(); err == nil {
			m.Rotation = v
		}
	}
	position := func(offset int, absent json.RawMessage) *cleaning.MapPosition {
		x, y, angle := readInt(offset), readInt(offset+2), readInt(offset+4)
		if mapFlag(absent) || angle == 32767 || (x == 32767 && y == 32767) {
			return nil
		}
		return &cleaning.MapPosition{X: float64(x), Y: float64(y), Angle: float64(angle)}
	}
	m.Robot, m.Dock = position(5, tail.NoRobot), position(11, tail.NoCharger)
	pixels := raw[27:end]
	classes := make([]int, len(pixels))
	rooms := map[int]*roomPixels{}
	frameMap := mapFlag(tail.FrameMap)
	version3 := len(tail.SaveMapID) > 0
	unsaved := string(tail.SavedStatus) == "0" || string(tail.SavedStatus) == "1"
	for i, pixel := range pixels {
		class := classifyMapPixel(pixel, frameMap, version3, unsaved)
		classes[i] = class
		if class > 0 && class < 64 {
			p := rooms[class]
			if p == nil {
				p = &roomPixels{distance: math.Inf(1)}
				rooms[class] = p
			}
			p.count++
			p.sumX += int64(i % width)
			p.sumY += int64(i / width)
		}
	}
	paths := map[int]*strings.Builder{}
	runCount := 0
	for y := 0; y < height; y++ {
		for x := 0; x < width; {
			class := classes[y*width+x]
			endX := x + 1
			for endX < width && classes[y*width+endX] == class {
				endX++
			}
			if class != 0 {
				runCount++
				if runCount > 200000 {
					return cleaning.MapSnapshot{}, errors.New("saved map contains too many pixel runs to display")
				}
				builder := paths[class]
				if builder == nil {
					builder = &strings.Builder{}
					paths[class] = builder
				}
				fmt.Fprintf(builder, "M%d %dh%dv1h-%dz", x, height-y-1, endX-x, endX-x)
			}
			x = endX
		}
	}
	for i, class := range classes {
		if p := rooms[class]; p != nil {
			x, y := i%width, i/width
			distance := math.Pow(float64(x)-float64(p.sumX)/float64(p.count), 2) + math.Pow(float64(y)-float64(p.sumY)/float64(p.count), 2)
			if distance < p.distance {
				p.labelX, p.labelY, p.distance = x, y, distance
			}
		}
	}
	keys := make([]int, 0, len(paths))
	for class := range paths {
		keys = append(keys, class)
	}
	sort.Ints(keys)
	for _, class := range keys {
		kind, roomID := "room", class
		if class == 254 {
			kind, roomID = "floor", 0
		} else if class == 255 {
			kind, roomID = "wall", 0
		}
		m.Layers = append(m.Layers, cleaning.MapLayer{Kind: kind, RoomID: roomID, Path: paths[class].String()})
		if p := rooms[class]; p != nil {
			name := tail.Segments[strconv.Itoa(class)].Name
			if decoded, err := base64.StdEncoding.DecodeString(name); err == nil && utf8.Valid(decoded) {
				name = string(decoded)
			}
			m.Rooms = append(m.Rooms, cleaning.MapRoom{ID: class, Name: name, X: float64(m.Left) + (float64(p.labelX)+0.5)*float64(grid), Y: float64(m.Top) + (float64(p.labelY)+0.5)*float64(grid), Area: float64(p.count) * float64(grid) * float64(grid) / 1e6})
		}
	}
	for _, coords := range tail.VirtualWalls.Lines {
		if len(coords) >= 4 {
			m.Walls = append(m.Walls, []cleaning.MapPoint{{X: coords[0], Y: coords[1]}, {X: coords[2], Y: coords[3]}})
		}
	}
	for _, group := range []struct {
		Kind     string
		Polygons [][]float64
	}{{"no_go", tail.VirtualWalls.NoGo}, {"no_mop", tail.VirtualWalls.NoMop}} {
		for _, coords := range group.Polygons {
			if len(coords) < 4 {
				continue
			}
			x0, x1 := math.Min(coords[0], coords[2]), math.Max(coords[0], coords[2])
			y0, y1 := math.Min(coords[1], coords[3]), math.Max(coords[1], coords[3])
			area := cleaning.MapArea{Kind: group.Kind, Points: []cleaning.MapPoint{{X: x0, Y: y0}, {X: x1, Y: y0}, {X: x1, Y: y1}, {X: x0, Y: y1}}}
			m.Areas = append(m.Areas, area)
		}
	}
	m.Path = decodeMapTrace(tail.Trace)
	if len(tail.SaveMapID) > 0 {
		m.SavedMapID, _ = strconv.Atoi(strings.Trim(string(tail.SaveMapID), "\""))
	}
	if tail.EmbeddedMap != "" {
		inner, err := decodeMapFrame(tail.EmbeddedMap, m.Rotation, depth+1)
		if err != nil {
			return cleaning.MapSnapshot{}, err
		}
		m.SavedMapID = inner.ID
		if len(m.Layers) == 0 || (width <= 2 && height <= 2) || string(tail.SavedStatus) == "2" {
			inner.Robot, inner.Dock, inner.Path = m.Robot, m.Dock, m.Path
			inner.SavedMapID = inner.ID
			return inner, nil
		}
	}

	if width == 0 || height == 0 || len(m.Layers) == 0 {
		return cleaning.MapSnapshot{}, errors.New("saved map contains no visible floor area")
	}
	return m, nil
}

func mapFlag(raw json.RawMessage) bool { return string(raw) == "true" || string(raw) == "1" }

func classifyMapPixel(pixel byte, frameMap, version3, unsaved bool) int {
	if pixel == 0 {
		return 0
	}
	if version3 {
		room, wall := int(pixel&31), (pixel>>5)&3
		if room == 0 {
			return 0
		}
		if wall != 0 {
			return 255
		}
		if room == 31 {
			return 254
		}
		return room
	}
	if frameMap {
		room := int(pixel >> 2)
		switch room {
		case 63:
			return 255
		case 62:
			return 254
		case 61:
			return 0
		case 0:
			if pixel&3 == 2 {
				return 255
			}
			return 254
		default:
			return room
		}
	}
	if unsaved {
		if pixel&63 == 2 {
			return 255
		}
		if pixel&63 == 1 || pixel&63 == 3 {
			return 254
		}
		return 0
	}
	if pixel&128 != 0 {
		return 255
	}
	return int(pixel & 63)
}

var mapTracePattern = regexp.MustCompile(`([MWSLl])(-?\d+),(-?\d+)`)

func decodeMapTrace(trace string) []cleaning.MapPoint {
	result := []cleaning.MapPoint{}
	var current cleaning.MapPoint
	for _, match := range mapTracePattern.FindAllStringSubmatch(trace, 100000) {
		x, _ := strconv.ParseFloat(match[2], 64)
		y, _ := strconv.ParseFloat(match[3], 64)
		if match[1] == "L" {
			current.X += x
			current.Y += y
		} else {
			current = cleaning.MapPoint{X: x, Y: y}
		}
		result = append(result, current)
	}
	return result
}
