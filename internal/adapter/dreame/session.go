package dreame

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"net/http"
	"net/mail"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

// DeviceInfo identifies a device and its command endpoint within Dreame cloud.
type DeviceInfo struct {
	ID           string
	Model        string
	ProductName  string
	ImageSources []string
	Manufacturer string
	Name         string
	Shard        string
	Online       bool
}

// Session owns serialized access to an authenticated Dreamehome connection.
type Session struct {
	mu           sync.Mutex
	client       *cloudClient
	credentials  Credentials
	expires      time.Time
	nextID       int
	accountID    string
	refreshToken string
}

// NewSession creates a cloud connection; credentials are exchanged on first use.
func NewSession(credentials Credentials) (*Session, error) {
	credentials.Email = strings.TrimSpace(credentials.Email)
	credentials.Region = strings.ToLower(strings.TrimSpace(credentials.Region))
	address, err := mail.ParseAddress(credentials.Email)
	if err != nil || address.Address != credentials.Email || len(credentials.Email) > 254 {
		return nil, errors.New("enter the Dreamehome email")
	}
	switch credentials.Region {
	case "eu", "us", "cn", "ru", "sg", "kr", "in":
	default:
		return nil, errors.New("unsupported Dreame cloud region")
	}
	if credentials.Email == "" || credentials.Password == "" {
		return nil, errors.New("Dreame email and password are required")
	}
	transport := &http.Client{Timeout: 12 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
	return &Session{client: newClient(transport, "https://"+credentials.Region+".iot.dreame.tech:13267", credentials.Email), credentials: credentials}, nil
}

func (s *Session) authenticate(ctx context.Context) error {
	if s.client.token != "" && time.Now().Before(s.expires) {
		return nil
	}
	var raw json.RawMessage
	var err error
	if s.refreshToken != "" {
		raw, err = s.client.request(ctx, "/dreame-auth/oauth/token", "application/x-www-form-urlencoded", []byte(url.Values{"grant_type": {"refresh_token"}, "refresh_token": {s.refreshToken}, "scope": {"all"}}.Encode()))
		if err != nil {
			s.refreshToken = ""
		}
	}
	if s.refreshToken == "" {
		raw, err = s.client.login(ctx, s.credentials.Password)
	}
	if err != nil {
		return err
	}
	var auth struct {
		Access   string `json:"access_token"`
		Refresh  string `json:"refresh_token"`
		UID      string `json:"uid"`
		Expires  int    `json:"expires_in"`
		Tenant   string `json:"tenant_id"`
		Region   string `json:"region"`
		Language string `json:"lang"`
		Country  string `json:"country"`
	}
	if json.Unmarshal(raw, &auth) != nil || auth.Access == "" {
		return errors.New("invalid Dreame authentication response")
	}
	s.client.token = auth.Access
	s.client.tenant = auth.Tenant
	s.client.region = auth.Region
	s.client.language = auth.Language
	s.client.country = auth.Country
	s.client.secrets = append(s.client.secrets, auth.Access, auth.Refresh)
	if auth.UID != "" {
		s.accountID = auth.UID
	}
	s.refreshToken = auth.Refresh
	if auth.Expires <= 60 {
		auth.Expires = 120
	}
	s.expires = time.Now().Add(time.Duration(auth.Expires-60) * time.Second)
	return nil
}

// AccountID returns the authenticated account identity, independent of its email.
func (s *Session) AccountID() string { s.mu.Lock(); defer s.mu.Unlock(); return s.accountID }

// Discover returns vacuum identities without fetching maps or historical records.
func (s *Session) Discover(ctx context.Context) ([]DeviceInfo, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := s.authenticate(ctx); err != nil {
		return nil, err
	}
	devices := []DeviceInfo{}
	for page := 1; page <= 10; page++ {
		params, _ := json.Marshal(struct {
			Current int `json:"current"`
			Size    int `json:"size"`
			Shared  int `json:"sharedStatus"`
		}{page, 100, 1})
		raw, err := s.client.read(ctx, "/dreame-user-iot/iotuserbind/device/listV2", params)
		if err != nil {
			return nil, err
		}
		var response struct {
			Data struct {
				Page struct {
					Records []struct {
						ID         json.RawMessage `json:"did"`
						Model      string          `json:"model"`
						Name       string          `json:"customName"`
						Domain     string          `json:"bindDomain"`
						Online     bool            `json:"online"`
						Vendor     string          `json:"vendor"`
						DeviceInfo struct {
							DisplayName string `json:"displayName"`
							MainImage   struct {
								URL string `json:"imageUrl"`
							} `json:"mainImage"`
							Icon struct {
								URL string `json:"imageUrl"`
							} `json:"icon"`
						} `json:"deviceInfo"`
					} `json:"records"`
				} `json:"page"`
			} `json:"data"`
		}
		if json.Unmarshal(raw, &response) != nil || response.Data.Page.Records == nil {
			return nil, errors.New("invalid Dreame device list")
		}
		for _, r := range response.Data.Page.Records {
			if !strings.Contains(r.Model, ".vacuum.") {
				continue
			}
			shard := shardPattern.FindStringSubmatch(r.Domain)
			if len(shard) != 2 {
				return nil, errors.New("Dreame device has no command endpoint")
			}
			images := []string{}
			for _, image := range []string{r.DeviceInfo.MainImage.URL, r.DeviceInfo.Icon.URL} {
				if image = strings.TrimSpace(image); image != "" {
					images = append(images, image)
				}
			}
			devices = append(devices, DeviceInfo{ID: jsonString(r.ID), Model: r.Model, ProductName: strings.TrimSpace(r.DeviceInfo.DisplayName), ImageSources: images, Manufacturer: strings.TrimSpace(r.Vendor), Name: r.Name, Shard: shard[1], Online: r.Online})
		}
		if len(response.Data.Page.Records) < 100 {
			break
		}
	}
	return devices, nil
}

func (s *Session) rpc(ctx context.Context, d DeviceInfo, method string, params json.RawMessage) (json.RawMessage, error) {
	if !shardPattern.MatchString(d.Shard+".") || d.ID == "" {
		return nil, errors.New("invalid Dreame device identity")
	}
	if err := s.authenticate(ctx); err != nil {
		return nil, err
	}
	s.nextID++
	type command struct {
		DID    string          `json:"did"`
		ID     int             `json:"id"`
		Method string          `json:"method"`
		Params json.RawMessage `json:"params"`
	}
	body, _ := json.Marshal(struct {
		DID  string  `json:"did"`
		ID   int     `json:"id"`
		Data command `json:"data"`
	}{d.ID, s.nextID, command{d.ID, s.nextID, method, params}})
	raw, err := s.client.read(ctx, "/dreame-iot-com-"+d.Shard+"/device/sendCommand", body)
	if err != nil {
		if strings.Contains(err.Error(), "HTTP 401") {
			s.expires = time.Time{}
			s.refreshToken = ""
		}
		return nil, err
	}
	var response struct {
		Data struct {
			Result json.RawMessage `json:"result"`
		} `json:"data"`
	}
	if json.Unmarshal(raw, &response) != nil || len(response.Data.Result) == 0 || string(response.Data.Result) == "null" {
		return nil, errors.New("Dreame did not return a command result")
	}
	return response.Data.Result, nil
}

// PropertyKey selects one MIoT property from the device.
type PropertyKey struct {
	SIID int
	PIID int
}

// PropertyValue is a reported property; a nonzero code means its value is unavailable.
type PropertyValue struct {
	SIID  int             `json:"siid"`
	PIID  int             `json:"piid"`
	Code  int             `json:"code"`
	Value json.RawMessage `json:"value"`
}

// ReadProperties reads only requested properties, in bounded batches.
func (s *Session) ReadProperties(ctx context.Context, d DeviceInfo, keys []PropertyKey) ([]PropertyValue, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	values := []PropertyValue{}
	for start := 0; start < len(keys); start += 15 {
		batch := []propertyRequest{}
		for i, key := range keys[start:min(start+15, len(keys))] {
			if key.SIID <= 0 || key.PIID <= 0 {
				return nil, errors.New("invalid property key")
			}
			batch = append(batch, propertyRequest{strconv.Itoa(i), key.SIID, key.PIID})
		}
		params, _ := json.Marshal(batch)
		raw, err := s.rpc(ctx, d, "get_properties", params)
		if err != nil {
			return nil, err
		}
		var result []PropertyValue
		if json.Unmarshal(raw, &result) != nil {
			return nil, errors.New("invalid Dreame property response")
		}
		values = append(values, result...)
	}
	return values, nil
}

type actionValue struct {
	PIID  int             `json:"piid"`
	Value json.RawMessage `json:"value"`
}

func (s *Session) action(ctx context.Context, d DeviceInfo, siid, aiid int, input []actionValue) (json.RawMessage, error) {
	if input == nil {
		input = []actionValue{}
	}
	params, _ := json.Marshal(struct {
		DID   string        `json:"did"`
		SIID  int           `json:"siid"`
		AIID  int           `json:"aiid"`
		Input []actionValue `json:"in"`
	}{d.ID, siid, aiid, input})
	raw, err := s.rpc(ctx, d, "action", params)
	if err != nil {
		return nil, err
	}
	var result struct {
		Code *int `json:"code"`
	}
	if json.Unmarshal(raw, &result) != nil || result.Code == nil {
		return nil, errors.New("invalid Dreame action response")
	}
	if *result.Code != 0 {
		return nil, cleaning.Reject(fmt.Errorf("Dreame action returned code %d", *result.Code))
	}
	return raw, nil
}

// Control requests a known operation. It reports acknowledgement, not physical completion.
func (s *Session) Control(ctx context.Context, d DeviceInfo, operation string) error {
	actions := map[string][2]int{"resume": {2, 1}, "pause": {2, 2}, "dock": {3, 1}, "stop": {4, 2}, "locate": {7, 1}, "empty_bin": {15, 1}}
	a, ok := actions[operation]
	if !ok {
		return errors.New("unsupported cleaning operation")
	}
	if d.Model != "dreame.vacuum.r2423" {
		return errors.New("cleaning controls are not verified for this model")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	_, err := s.action(ctx, d, a[0], a[1], nil)
	return err
}

// ResetConsumable resets a supported maintenance counter after physical servicing.
func (s *Session) ResetConsumable(ctx context.Context, d DeviceInfo, name string) error {
	services := map[string]int{"main_brush": 9, "side_brush": 10, "filter": 11, "sensors": 16}
	siid, ok := services[name]
	if !ok || d.Model != "dreame.vacuum.r2423" {
		return errors.New("maintenance reset is unsupported")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	_, err := s.action(ctx, d, siid, 1, nil)
	return err
}

// SegmentOptions describes one room-cleaning destination and its explicit settings.
type SegmentOptions struct {
	ID      int
	Repeats int
	Suction int
	Water   int
}

// StartSegments starts only the given robot segments, without retrying ambiguous responses.
func (s *Session) StartSegments(ctx context.Context, d DeviceInfo, segments []SegmentOptions) error {
	if d.Model != "dreame.vacuum.r2423" {
		return errors.New("cleaning controls are not verified for this model")
	}
	if len(segments) == 0 {
		return errors.New("select at least one cleaning room")
	}
	segments = append([]SegmentOptions(nil), segments...)
	sort.Slice(segments, func(i, j int) bool { return segments[i].ID < segments[j].ID })
	selects := make([][5]int, 0, len(segments))
	seen := map[int]bool{}
	for _, room := range segments {
		if room.ID <= 0 || room.ID >= 64 || room.Repeats < 1 || room.Repeats > 3 || room.Suction < 0 || room.Suction > 3 || room.Water < 1 || room.Water > 3 {
			return errors.New("invalid room cleaning settings")
		}
		if seen[room.ID] {
			continue
		}
		seen[room.ID] = true
		selects = append(selects, [5]int{room.ID, room.Repeats, room.Suction, room.Water, 1})
	}
	value, _ := json.Marshal(struct {
		Selects [][5]int `json:"selects"`
	}{selects})
	encoded, _ := json.Marshal(string(value))
	s.mu.Lock()
	defer s.mu.Unlock()
	_, err := s.action(ctx, d, 4, 1, []actionValue{{PIID: 1, Value: json.RawMessage("18")}, {PIID: 10, Value: encoded}})
	return err
}

// CurrentMap requests a complete frame; a saved-map position is never substituted.
func (s *Session) CurrentMap(ctx context.Context, d DeviceInfo) (cleaning.MapSnapshot, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	request, _ := json.Marshal(`{"req_type":1,"frame_type":"I","force_type":1}`)
	raw, err := s.action(ctx, d, 6, 1, []actionValue{{PIID: 2, Value: request}})
	if err != nil {
		return cleaning.MapSnapshot{}, err
	}
	var result struct {
		Output []actionValue `json:"out"`
	}
	if json.Unmarshal(raw, &result) != nil {
		return cleaning.MapSnapshot{}, errors.New("invalid current-map response")
	}
	var frameAt *time.Time
	for _, p := range result.Output {
		if p.PIID == 5 {
			stamp, err := strconv.ParseInt(jsonString(p.Value), 10, 64)
			if err == nil {
				var at time.Time
				if stamp > 1e12 {
					at = time.UnixMilli(stamp)
				} else if stamp > 1e9 {
					at = time.Unix(stamp, 0)
				}
				if !at.IsZero() && at.Before(time.Now().Add(time.Minute)) {
					utc := at.UTC()
					frameAt = &utc
				}
			}
		}
	}
	decodeFrame := func(encoded string) (cleaning.MapSnapshot, error) {
		frame, err := decodeMap(encoded, 0)
		frame.FrameAt = frameAt
		return frame, err
	}
	for _, p := range result.Output {
		value := jsonString(p.Value)
		if value == "" {
			continue
		}
		if p.PIID == 13 {
			parts := strings.SplitN(value, ",", 3)
			if len(parts) >= 2 {
				if parts[0] == "0" {
					return decodeFrame(parts[1])
				}
				value = parts[1]
				p.PIID = 3
			}
		}
		if p.PIID == 1 {
			return decodeFrame(value)
		}
		if p.PIID == 3 {
			report := DeviceReport{ID: d.ID, Model: d.Model}
			data, err := s.client.readMapFile(ctx, &report, value, s.credentials.Region, "Current map")
			if err != nil {
				return cleaning.MapSnapshot{}, err
			}
			return decodeFrame(string(data))
		}
	}
	return cleaning.MapSnapshot{}, errors.New("Dreame did not return a current map frame")
}

// SavedMaps reads the catalogue and its complete saved maps without historical data.
func (s *Session) SavedMaps(ctx context.Context, d DeviceInfo) ([]cleaning.MapSnapshot, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	params, _ := json.Marshal([]propertyRequest{{"map-list", 6, 8}})
	raw, err := s.rpc(ctx, d, "get_properties", params)
	if err != nil {
		return nil, err
	}
	var values []PropertyValue
	if json.Unmarshal(raw, &values) != nil || len(values) != 1 || values[0].Code != 0 {
		return nil, errors.New("saved map catalogue is unavailable")
	}
	report := DeviceReport{ID: d.ID, Model: d.Model, Maps: []cleaning.MapSnapshot{}}
	s.client.inspectMapCatalogue(ctx, &report, Property{Name: "MAP_LIST", Value: string(values[0].Value)}, s.credentials.Region)
	for _, read := range report.Reads {
		if read.Error != nil {
			return nil, errors.New(*read.Error)
		}
	}
	for i := range report.Maps {
		report.Maps[i].Revision = cleaning.MapRevision(report.Maps[i])
	}
	return report.Maps, nil
}
