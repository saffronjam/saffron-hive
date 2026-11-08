// Package dreame reads Dreamehome cloud diagnostics without changing device settings.
package dreame

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"net/http"
	"net/mail"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/saffronjam/saffron-hive/internal/audit"
)

// Credentials are used only for the duration of a diagnostic request.
type Credentials struct {
	Email    string
	Password string
	Region   string
}

// Read contains a sanitized response and any error for an individual endpoint.
type Read struct {
	Name  string
	JSON  string
	Error *string
}

// Property is a reported MIoT property, including unsupported-property codes.
type Property struct {
	Name  string
	SIID  int
	PIID  int
	Value string
	Code  int
}

// DeviceReport collects device metadata, properties, maps and history reads.
type DeviceReport struct {
	ID         string
	Name       string
	Model      string
	Reads      []Read
	Properties []Property
	Maps       []cleaning.MapSnapshot
}

// Report is a single diagnostic snapshot; it contains no reusable credentials.
type Report struct {
	CompletedAt   time.Time
	Authenticated bool
	Reads         []Read
	Devices       []DeviceReport
}

// Probe performs a bounded, read-only inspection of a Dreamehome account.
type Probe struct {
	http    *http.Client
	baseURL func(string) string
}

// NewProbe creates a diagnostic reader using the regional Dreame cloud endpoints.
func NewProbe() *Probe {
	return &Probe{
		http:    &http.Client{Timeout: 12 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }},
		baseURL: func(region string) string { return "https://" + region + ".iot.dreame.tech:13267" },
	}
}

// Inspect reads the account and discovered vacuums without storing credentials or issuing actions.
func (p *Probe) Inspect(ctx context.Context, input Credentials) (Report, error) {
	input.Email = strings.TrimSpace(input.Email)
	input.Region = strings.ToLower(strings.TrimSpace(input.Region))
	address, err := mail.ParseAddress(input.Email)
	if err != nil || address.Address != input.Email || len(input.Email) > 254 {
		return Report{}, errors.New("enter the email address used in the Dreamehome app")
	}
	if input.Password == "" || len(input.Password) > 1024 {
		return Report{}, errors.New("enter the Dreamehome app password")
	}
	switch input.Region {
	case "eu", "us", "cn", "ru", "sg", "kr", "in":
	default:
		return Report{}, errors.New("select a supported Dreame cloud server region")
	}
	ctx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()
	c := newClient(p.http, p.baseURL(input.Region), input.Email)
	report := Report{Reads: []Read{}, Devices: []DeviceReport{}}
	login, loginErr := c.login(ctx, input.Password)
	report.Reads = append(report.Reads, c.result("Authentication", login, loginErr))
	if loginErr != nil {
		report.CompletedAt = time.Now().UTC()
		return report, nil
	}
	report.Authenticated = true
	for page := 1; page <= 10; page++ {
		params, _ := json.Marshal(struct {
			Current      int `json:"current"`
			Size         int `json:"size"`
			SharedStatus int `json:"sharedStatus"`
		}{page, 100, 1})
		raw, readErr := c.read(ctx, "/dreame-user-iot/iotuserbind/device/listV2", params)
		report.Reads = append(report.Reads, c.result(fmt.Sprintf("Device discovery (page %d)", page), raw, readErr))
		if readErr != nil {
			break
		}
		var list struct {
			Data struct {
				Page struct {
					Records []json.RawMessage `json:"records"`
					Total   json.Number       `json:"total"`
				} `json:"page"`
			} `json:"data"`
		}
		if json.Unmarshal(raw, &list) != nil || list.Data.Page.Records == nil {
			report.Reads[len(report.Reads)-1].Error = errorPointer("Dreame returned an unexpected device-list shape")
			break
		}
		for _, record := range list.Data.Page.Records {
			device := c.inspectDevice(ctx, record, input.Region)
			report.Devices = append(report.Devices, device)
		}
		total, _ := list.Data.Page.Total.Int64()
		if len(list.Data.Page.Records) < 100 || (total > 0 && int64(page*100) >= total) || ctx.Err() != nil {
			break
		}
	}
	report.CompletedAt = time.Now().UTC()
	return report, nil
}

var shardPattern = regexp.MustCompile(`^([0-9]{1,8})\.`)

func (c *cloudClient) inspectDevice(ctx context.Context, record json.RawMessage, region string) DeviceReport {
	var info struct {
		DID        json.RawMessage `json:"did"`
		Model      string          `json:"model"`
		Name       string          `json:"customName"`
		MasterUID  json.RawMessage `json:"masterUid"`
		BindDomain string          `json:"bindDomain"`
		DeviceInfo struct {
			DisplayName string `json:"displayName"`
		} `json:"deviceInfo"`
	}
	_ = json.Unmarshal(record, &info)
	id := jsonString(info.DID)
	name := info.Name
	if name == "" {
		name = info.DeviceInfo.DisplayName
	}
	if name == "" {
		name = info.Model
	}
	d := DeviceReport{ID: id, Name: name, Model: info.Model, Reads: []Read{c.result("Discovery metadata", record, nil)}, Properties: []Property{}, Maps: []cleaning.MapSnapshot{}}
	if id == "" || !strings.Contains(info.Model, ".vacuum.") {
		return d
	}
	params, _ := json.Marshal(struct {
		DID string `json:"did"`
	}{id})
	raw, err := c.read(ctx, "/dreame-user-iot/iotuserbind/device/info", params)
	d.Reads = append(d.Reads, c.result("Device information", raw, err))
	if err == nil {
		var envelope struct {
			Data struct {
				BindDomain string          `json:"bindDomain"`
				MasterUID  json.RawMessage `json:"masterUid"`
			} `json:"data"`
		}
		if json.Unmarshal(raw, &envelope) == nil {
			if envelope.Data.BindDomain != "" {
				info.BindDomain = envelope.Data.BindDomain
			}
			if len(envelope.Data.MasterUID) > 0 {
				info.MasterUID = envelope.Data.MasterUID
			}
		}
	}
	raw, err = c.read(ctx, "/dreame-user-iot/iotstatus/devOTCInfo", params)
	d.Reads = append(d.Reads, c.result("Network and firmware information", raw, err))
	keys := make([]string, 0, len(propertyCatalog))
	for _, prop := range propertyCatalog {
		keys = append(keys, fmt.Sprintf("%d.%d", prop.SIID, prop.PIID))
	}
	cacheParams, _ := json.Marshal(struct {
		DID  string   `json:"did"`
		Keys []string `json:"keys"`
	}{id, keys})
	raw, err = c.read(ctx, "/dreame-user-iot/iotstatus/props", cacheParams)
	d.Reads = append(d.Reads, c.result("Cloud property snapshot", raw, err))
	historyParams, _ := json.Marshal(struct {
		UID    string `json:"uid"`
		DID    string `json:"did"`
		From   int64  `json:"from"`
		Limit  int    `json:"limit"`
		SIID   string `json:"siid"`
		EIID   string `json:"eiid"`
		Region string `json:"region"`
		Type   int    `json:"type"`
	}{jsonString(info.MasterUID), id, 1687019188, 20, "4", "1", region, 3})
	raw, err = c.read(ctx, "/dreame-user-iot/iotstatus/history", historyParams)
	d.Reads = append(d.Reads, c.result("Cleaning history (up to 20 records)", raw, err))
	shard := shardPattern.FindStringSubmatch(info.BindDomain)
	if len(shard) != 2 {
		d.Reads = append(d.Reads, c.result("Live properties", nil, errors.New("Dreame did not report a device command shard")))
		return d
	}
	for start := 0; start < len(propertyCatalog); start += 15 {
		end := min(start+15, len(propertyCatalog))
		batch := make([]propertyRequest, 0, end-start)
		for _, p := range propertyCatalog[start:end] {
			batch = append(batch, propertyRequest{strconv.Itoa(p.ID), p.SIID, p.PIID})
		}
		rpcID := start + 100
		body, _ := json.Marshal(struct {
			DID  string `json:"did"`
			ID   int    `json:"id"`
			Data struct {
				DID    string            `json:"did"`
				ID     int               `json:"id"`
				Method string            `json:"method"`
				Params []propertyRequest `json:"params"`
			} `json:"data"`
		}{id, rpcID, struct {
			DID    string            `json:"did"`
			ID     int               `json:"id"`
			Method string            `json:"method"`
			Params []propertyRequest `json:"params"`
		}{id, rpcID, "get_properties", batch}})
		raw, err = c.read(ctx, "/dreame-iot-com-"+shard[1]+"/device/sendCommand", body)
		d.Reads = append(d.Reads, c.result(fmt.Sprintf("Live properties (batch %d)", start/15+1), raw, err))
		if err != nil {
			break
		}
		var envelope struct {
			Data struct {
				Result []struct {
					DID   json.RawMessage `json:"did"`
					SIID  int             `json:"siid"`
					PIID  int             `json:"piid"`
					Code  int             `json:"code"`
					Value json.RawMessage `json:"value"`
				} `json:"result"`
			} `json:"data"`
		}
		if json.Unmarshal(raw, &envelope) != nil || envelope.Data.Result == nil {
			d.Reads[len(d.Reads)-1].Error = errorPointer("Dreame returned no live property results")
			break
		}
		for _, value := range envelope.Data.Result {
			if value.SIID == 0 || value.PIID == 0 {
				for _, p := range propertyCatalog {
					if strconv.Itoa(p.ID) == jsonString(value.DID) {
						value.SIID, value.PIID = p.SIID, p.PIID
						break
					}
				}
			}
			propertyName := fmt.Sprintf("%d.%d", value.SIID, value.PIID)
			for _, p := range propertyCatalog {
				if p.SIID == value.SIID && p.PIID == value.PIID {
					propertyName = p.Name
					break
				}
			}
			d.Properties = append(d.Properties, Property{Name: propertyName, SIID: value.SIID, PIID: value.PIID, Code: value.Code, Value: c.sanitized(value.Value)})
		}
	}
	for _, property := range d.Properties {
		if property.Code == 0 && (property.Name == "MAP_LIST" || property.Name == "RECOVERY_MAP_LIST") {
			c.inspectMapCatalogue(ctx, &d, property, region)
		}
	}
	return d
}

func jsonString(raw json.RawMessage) string {
	var value string
	if json.Unmarshal(raw, &value) == nil {
		return value
	}
	var number json.Number
	if json.Unmarshal(raw, &number) == nil {
		return string(number)
	}
	return ""
}

func errorPointer(message string) *string { return &message }

func (c *cloudClient) result(name string, raw json.RawMessage, err error) Read {
	r := Read{Name: name, JSON: c.sanitized(raw)}
	if err != nil {
		r.Error = errorPointer(err.Error())
	}
	return r
}

func (c *cloudClient) sanitized(raw json.RawMessage) string {
	if len(raw) == 0 {
		return "null"
	}
	safe := c.redact(audit.Sanitize(raw))
	var buf bytes.Buffer
	if json.Indent(&buf, safe, "", "  ") != nil {
		return "null"
	}
	return buf.String()
}

func (c *cloudClient) redact(raw json.RawMessage) json.RawMessage {
	var object map[string]json.RawMessage
	if json.Unmarshal(raw, &object) == nil && object != nil {
		for key, value := range object {
			normalized := strings.ToLower(strings.NewReplacer("_", "", "-", "").Replace(key))
			if strings.HasSuffix(normalized, "key") {
				object[key] = json.RawMessage(`"[redacted]"`)
				continue
			}
			switch normalized {
			case "iotid", "sign", "signature", "security", "ssecurity":
				object[key] = json.RawMessage(`"[redacted]"`)
			default:
				object[key] = c.redact(value)
			}
		}
		result, _ := json.Marshal(object)
		return result
	}
	var list []json.RawMessage
	if json.Unmarshal(raw, &list) == nil && list != nil {
		for i := range list {
			list[i] = c.redact(list[i])
		}
		result, _ := json.Marshal(list)
		return result
	}
	var text string
	if json.Unmarshal(raw, &text) == nil {
		for _, secret := range c.secrets {
			if secret != "" {
				text = strings.ReplaceAll(text, secret, "[redacted]")
			}
		}
		if address, err := url.Parse(text); err == nil && address.Host != "" && address.RawQuery != "" {
			address.RawQuery = "redacted"
			text = address.String()
		}
		result, _ := json.Marshal(text)
		return result
	}
	return raw
}
