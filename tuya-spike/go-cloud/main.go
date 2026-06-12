package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

type config struct {
	AccessID     string
	AccessSecret string
	Region       string
	Host         string
	DeviceID     string
}

type client struct {
	cfg   config
	http  *http.Client
	token string
}

type tokenResponse struct {
	Success bool   `json:"success"`
	Code    int    `json:"code"`
	Msg     string `json:"msg"`
	Result  struct {
		AccessToken string `json:"access_token"`
		ExpireTime  int    `json:"expire_time"`
		UID         string `json:"uid"`
	} `json:"result"`
}

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) == 0 {
		usage()
		return nil
	}

	cfg, err := loadConfig()
	if err != nil {
		return err
	}

	c := &client{
		cfg:  cfg,
		http: &http.Client{Timeout: 20 * time.Second},
	}

	switch args[0] {
	case "token":
		resp, err := c.getToken()
		if err != nil {
			return err
		}
		return printJSON(map[string]any{
			"success":        resp.Success,
			"code":           resp.Code,
			"msg":            resp.Msg,
			"uid":            resp.Result.UID,
			"token_present":  resp.Result.AccessToken != "",
			"expire_seconds": resp.Result.ExpireTime,
		})
	case "discover":
		fs := flag.NewFlagSet("discover", flag.ExitOnError)
		ids := fs.String("ids", "", "Comma-separated device IDs. Defaults to TUYA_DEVICE_ID or ../devices.json")
		if err := fs.Parse(args[1:]); err != nil {
			return err
		}
		deviceIDs, err := resolveDeviceIDs(*ids, cfg.DeviceID)
		if err != nil {
			return err
		}
		return c.getAndPrint("/v1.0/devices?device_ids=" + url.QueryEscape(strings.Join(deviceIDs, ",")) + "&page_no=1&page_size=20")
	case "status":
		fs := flag.NewFlagSet("status", flag.ExitOnError)
		deviceID := fs.String("device", cfg.DeviceID, "Device ID")
		if err := fs.Parse(args[1:]); err != nil {
			return err
		}
		if *deviceID == "" {
			return errors.New("missing --device or TUYA_DEVICE_ID")
		}
		return c.getAndPrint("/v1.0/devices/" + url.PathEscape(*deviceID) + "/status")
	case "functions":
		fs := flag.NewFlagSet("functions", flag.ExitOnError)
		deviceID := fs.String("device", cfg.DeviceID, "Device ID")
		if err := fs.Parse(args[1:]); err != nil {
			return err
		}
		if *deviceID == "" {
			return errors.New("missing --device or TUYA_DEVICE_ID")
		}
		return c.getAndPrint("/v1.0/devices/" + url.PathEscape(*deviceID) + "/functions")
	case "specs":
		fs := flag.NewFlagSet("specs", flag.ExitOnError)
		deviceID := fs.String("device", cfg.DeviceID, "Device ID")
		if err := fs.Parse(args[1:]); err != nil {
			return err
		}
		if *deviceID == "" {
			return errors.New("missing --device or TUYA_DEVICE_ID")
		}
		return c.getAndPrint("/v1.0/devices/" + url.PathEscape(*deviceID) + "/specifications")
	case "command":
		fs := flag.NewFlagSet("command", flag.ExitOnError)
		deviceID := fs.String("device", cfg.DeviceID, "Device ID")
		code := fs.String("code", "", "Tuya command code, for example switch")
		value := fs.String("value", "", "JSON value, for example true, 22, or \"cold\"")
		if err := fs.Parse(args[1:]); err != nil {
			return err
		}
		if *deviceID == "" {
			return errors.New("missing --device or TUYA_DEVICE_ID")
		}
		if *code == "" {
			return errors.New("missing --code")
		}
		parsed, err := parseJSONValue(*value)
		if err != nil {
			return err
		}
		body, err := json.Marshal(map[string]any{
			"commands": []map[string]any{
				{"code": *code, "value": parsed},
			},
		})
		if err != nil {
			return err
		}
		return c.doAndPrint(http.MethodPost, "/v1.0/devices/"+url.PathEscape(*deviceID)+"/commands", body)
	case "raw":
		fs := flag.NewFlagSet("raw", flag.ExitOnError)
		method := fs.String("method", http.MethodGet, "HTTP method")
		path := fs.String("path", "", "API path, for example /v1.0/devices/{id}/status")
		body := fs.String("body", "", "Raw JSON request body")
		if err := fs.Parse(args[1:]); err != nil {
			return err
		}
		if *path == "" {
			return errors.New("missing --path")
		}
		var bodyBytes []byte
		if *body != "" {
			bodyBytes = []byte(*body)
		}
		return c.doAndPrint(strings.ToUpper(*method), *path, bodyBytes)
	default:
		usage()
		return fmt.Errorf("unknown command %q", args[0])
	}
}

func usage() {
	fmt.Print(`Tuya Cloud Go spike

Usage:
  go run . token
  go run . discover [--ids DEVICE_ID[,DEVICE_ID]]
  go run . status [--device DEVICE_ID]
  go run . functions [--device DEVICE_ID]
  go run . specs [--device DEVICE_ID]
  go run . command [--device DEVICE_ID] --code switch --value true
  go run . raw --method GET --path /v1.0/devices/{device_id}/status

Config is loaded from environment and ../tuya-spike.env:
  TUYA_ACCESS_ID
  TUYA_ACCESS_SECRET
  TUYA_REGION=eu
  TUYA_DEVICE_ID
`)
}

func loadConfig() (config, error) {
	_ = loadEnvFile("../tuya-spike.env")
	cfg := config{
		AccessID:     os.Getenv("TUYA_ACCESS_ID"),
		AccessSecret: os.Getenv("TUYA_ACCESS_SECRET"),
		Region:       firstNonEmpty(os.Getenv("TUYA_REGION"), "eu"),
		Host:         os.Getenv("TUYA_CLOUD_HOST"),
		DeviceID:     os.Getenv("TUYA_DEVICE_ID"),
	}
	if cfg.Host == "" {
		host, err := hostForRegion(cfg.Region)
		if err != nil {
			return config{}, err
		}
		cfg.Host = host
	}
	if cfg.AccessID == "" || cfg.AccessSecret == "" {
		return config{}, errors.New("missing TUYA_ACCESS_ID or TUYA_ACCESS_SECRET")
	}
	return cfg, nil
}

func loadEnvFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return err
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if os.Getenv(key) == "" {
			_ = os.Setenv(key, value)
		}
	}
	return nil
}

func hostForRegion(region string) (string, error) {
	switch region {
	case "cn":
		return "https://openapi.tuyacn.com", nil
	case "eu", "eu-central":
		return "https://openapi.tuyaeu.com", nil
	case "us":
		return "https://openapi.tuyaus.com", nil
	case "in":
		return "https://openapi.tuyain.com", nil
	default:
		return "", fmt.Errorf("unknown TUYA_REGION %q; set TUYA_CLOUD_HOST to override", region)
	}
}

func (c *client) getToken() (*tokenResponse, error) {
	req, err := c.newSignedRequest(http.MethodGet, "/v1.0/token?grant_type=1", nil, "")
	if err != nil {
		return nil, err
	}
	var resp tokenResponse
	if err := c.do(req, &resp); err != nil {
		return nil, err
	}
	if !resp.Success {
		return &resp, fmt.Errorf("token request failed: code=%d msg=%s", resp.Code, resp.Msg)
	}
	c.token = resp.Result.AccessToken
	return &resp, nil
}

func (c *client) getTokenString() (string, error) {
	if c.token != "" {
		return c.token, nil
	}
	resp, err := c.getToken()
	if err != nil {
		return "", err
	}
	return resp.Result.AccessToken, nil
}

func (c *client) getAndPrint(path string) error {
	return c.doAndPrint(http.MethodGet, path, nil)
}

func (c *client) doAndPrint(method, path string, body []byte) error {
	token, err := c.getTokenString()
	if err != nil {
		return err
	}
	req, err := c.newSignedRequest(method, path, body, token)
	if err != nil {
		return err
	}
	var raw json.RawMessage
	if err := c.do(req, &raw); err != nil {
		return err
	}
	return printJSON(raw)
}

func (c *client) newSignedRequest(method, apiPath string, body []byte, token string) (*http.Request, error) {
	if !strings.HasPrefix(apiPath, "/") {
		return nil, errors.New("API path must start with /")
	}
	reqURL := c.cfg.Host + apiPath
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequest(method, reqURL, reader)
	if err != nil {
		return nil, err
	}
	timestamp := strconv.FormatInt(time.Now().UnixMilli(), 10)
	req.Header.Set("client_id", c.cfg.AccessID)
	req.Header.Set("sign_method", "HMAC-SHA256")
	req.Header.Set("t", timestamp)
	if token != "" {
		req.Header.Set("access_token", token)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("sign", c.sign(req, body, token, timestamp))
	return req, nil
}

func (c *client) sign(req *http.Request, body []byte, token, timestamp string) string {
	bodyHash := sha256Hex(body)
	headers := ""
	uri := canonicalURI(req.URL)
	stringToSign := req.Method + "\n" + bodyHash + "\n" + headers + "\n" + uri
	payload := c.cfg.AccessID + token + timestamp + stringToSign
	return strings.ToUpper(hmacSHA256Hex(payload, c.cfg.AccessSecret))
}

func (c *client) do(req *http.Request, out any) error {
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(data))
	}
	if err := json.Unmarshal(data, out); err != nil {
		return fmt.Errorf("decode response: %w: %s", err, string(data))
	}
	return nil
}

func canonicalURI(u *url.URL) string {
	uri := u.Path
	query, err := url.ParseQuery(u.RawQuery)
	if err != nil || len(query) == 0 {
		return uri
	}
	keys := make([]string, 0, len(query))
	for key := range query {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, key+"="+query.Get(key))
	}
	return uri + "?" + strings.Join(parts, "&")
}

func sha256Hex(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

func hmacSHA256Hex(data, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	_, _ = h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func parseJSONValue(raw string) (any, error) {
	if raw == "" {
		return nil, errors.New("missing --value")
	}
	var value any
	if err := json.Unmarshal([]byte(raw), &value); err == nil {
		return value, nil
	}
	return raw, nil
}

func printJSON(value any) error {
	var data []byte
	var err error
	switch v := value.(type) {
	case json.RawMessage:
		var formatted any
		if err := json.Unmarshal(v, &formatted); err != nil {
			return err
		}
		formatted = redactSecrets(formatted)
		data, err = json.MarshalIndent(formatted, "", "  ")
	default:
		value = redactSecrets(value)
		data, err = json.MarshalIndent(value, "", "  ")
	}
	if err != nil {
		return err
	}
	fmt.Println(string(data))
	return nil
}

func redactSecrets(value any) any {
	switch v := value.(type) {
	case map[string]any:
		out := make(map[string]any, len(v))
		for key, child := range v {
			if isSecretKey(key) {
				out[key] = "[redacted]"
				continue
			}
			out[key] = redactSecrets(child)
		}
		return out
	case []any:
		out := make([]any, 0, len(v))
		for _, child := range v {
			out = append(out, redactSecrets(child))
		}
		return out
	default:
		return value
	}
}

func isSecretKey(key string) bool {
	switch strings.ToLower(key) {
	case "local_key", "access_token", "refresh_token", "secret", "access_secret", "client_secret":
		return true
	default:
		return false
	}
}

func resolveDeviceIDs(ids, defaultID string) ([]string, error) {
	if ids != "" {
		return splitIDs(ids), nil
	}
	if defaultID != "" {
		return []string{defaultID}, nil
	}
	fromFile, err := deviceIDsFromTinyTuyaFile("../devices.json")
	if err != nil {
		return nil, err
	}
	if len(fromFile) == 0 {
		return nil, errors.New("no device IDs found; pass --ids or set TUYA_DEVICE_ID")
	}
	return fromFile, nil
}

func splitIDs(ids string) []string {
	parts := strings.Split(ids, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func deviceIDsFromTinyTuyaFile(path string) ([]string, error) {
	data, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		return nil, err
	}
	var devices []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(data, &devices); err != nil {
		return nil, err
	}
	out := make([]string, 0, len(devices))
	for _, device := range devices {
		if device.ID != "" {
			out = append(out, device.ID)
		}
	}
	return out, nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
