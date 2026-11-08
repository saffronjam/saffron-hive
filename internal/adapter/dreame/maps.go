package dreame

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

func (c *cloudClient) inspectMapCatalogue(ctx context.Context, device *DeviceReport, property Property, region string) {
	raw := []byte(property.Value)
	var encoded string
	if json.Unmarshal(raw, &encoded) == nil {
		raw = []byte(encoded)
	}
	var ref struct {
		ObjectName string `json:"object_name"`
		ObjName    string `json:"obj_name"`
	}
	if json.Unmarshal(raw, &ref) != nil {
		device.Reads = append(device.Reads, c.result(property.Name+" catalogue", nil, errors.New("map catalogue reference is invalid")))
		return
	}
	if ref.ObjectName == "" {
		ref.ObjectName = ref.ObjName
	}
	if ref.ObjectName == "" {
		device.Reads = append(device.Reads, c.result(property.Name+" catalogue", nil, errors.New("map catalogue reference has no object name")))
		return
	}
	data, err := c.readMapFile(ctx, device, ref.ObjectName, region, property.Name)
	if err != nil {
		return
	}
	if !json.Valid(data) {
		device.Reads = append(device.Reads, c.result(property.Name+" catalogue", nil, errors.New("map catalogue is not JSON")))
		return
	}
	device.Reads = append(device.Reads, c.result(property.Name+" catalogue", data, nil))
	if property.Name == "MAP_LIST" {
		c.decodeCatalogue(ctx, device, data, region)
	}
}

func (c *cloudClient) readMapFile(ctx context.Context, device *DeviceReport, object, region, label string) ([]byte, error) {
	params, _ := json.Marshal(struct {
		DID      string `json:"did"`
		Model    string `json:"model"`
		Filename string `json:"filename"`
		Region   string `json:"region"`
	}{device.ID, device.Model, object, region})
	raw, err := c.read(ctx, "/dreame-user-iot/iotfile/getDownloadUrl", params)
	device.Reads = append(device.Reads, c.result(label+" download reference", raw, err))
	if err != nil {
		return nil, err
	}
	var envelope response
	_ = json.Unmarshal(raw, &envelope)
	address := jsonString(envelope.Data)
	if address == "" {
		var link struct {
			URL string `json:"url"`
		}
		_ = json.Unmarshal(envelope.Data, &link)
		address = link.URL
	}
	data, err := c.downloadMapFile(ctx, address)
	if err != nil {
		device.Reads = append(device.Reads, c.result(label+" download", nil, err))
	}
	return data, err
}

func (c *cloudClient) downloadMapFile(ctx context.Context, address string) ([]byte, error) {
	parsed, err := url.Parse(address)
	if err != nil || parsed.Scheme != "https" || parsed.User != nil || (parsed.Port() != "" && parsed.Port() != "443") {
		return nil, errors.New("Dreame did not return an HTTPS map download URL")
	}
	host := strings.ToLower(parsed.Hostname())
	allowed := false
	for _, suffix := range []string{".iot.dreame.tech", ".aliyuncs.com", ".amazonaws.com", ".fds.api.xiaomi.com"} {
		if strings.HasSuffix(host, suffix) {
			allowed = true
			break
		}
	}
	if !allowed {
		return nil, errors.New("Dreame returned an unrecognized map storage host")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, address, nil)
	if err != nil {
		return nil, errors.New("could not prepare map catalogue download")
	}
	req.Header.Set("User-Agent", "okhttp/4.12.0")
	res, err := c.http.Do(req)
	if err != nil {
		return nil, errors.New("could not download map catalogue")
	}
	defer func() { _ = res.Body.Close() }()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("map storage returned HTTP %d", res.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(res.Body, maxResponseBytes+1))
	if err != nil {
		return nil, errors.New("could not read map catalogue")
	}
	if len(data) > maxResponseBytes {
		return nil, errors.New("map catalogue exceeds the 4 MiB diagnostic limit")
	}
	return data, nil
}

func (c *cloudClient) decodeCatalogue(ctx context.Context, device *DeviceReport, data []byte, region string) {
	var catalogue struct {
		Maps []json.RawMessage `json:"mapstr"`
	}
	if err := json.Unmarshal(data, &catalogue); err != nil || catalogue.Maps == nil {
		device.Reads = append(device.Reads, c.result("Map decoding", nil, errors.New("map catalogue does not contain a mapstr list")))
		return
	}
	for i, raw := range catalogue.Maps {
		label := fmt.Sprintf("Saved map %d", i+1)
		if i >= 12 {
			device.Reads = append(device.Reads, c.result(label, nil, errors.New("map catalogue exceeds the 12-map diagnostic limit")))
			break
		}
		var entry struct {
			Name   string      `json:"name"`
			Angle  json.Number `json:"angle"`
			Map    string      `json:"map"`
			Object string      `json:"rismobj"`
		}
		if err := json.Unmarshal(raw, &entry); err != nil {
			device.Reads = append(device.Reads, c.result(label, nil, errors.New("saved map entry could not be decoded")))
			continue
		}
		encoded := entry.Map
		if encoded == "" && entry.Object != "" {
			blob, err := c.readMapFile(ctx, device, entry.Object, region, label)
			if err != nil {
				continue
			}
			encoded = string(blob)
		}
		rotation, _ := entry.Angle.Float64()
		decoded, err := decodeMap(encoded, rotation)
		if err != nil {
			device.Reads = append(device.Reads, c.result(label+" decoding", nil, err))
			continue
		}
		decoded.Name = entry.Name
		device.Maps = append(device.Maps, decoded)
	}
}
