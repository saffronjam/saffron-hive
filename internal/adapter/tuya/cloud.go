package tuya

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AccessID     string
	AccessSecret string
	Region       string
	Enabled      bool
}

type CloudClient struct {
	cfg   Config
	host  string
	http  *http.Client
	token string
}

type DeviceInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	ProductName string `json:"productName"`
	ProductID   string `json:"productId"`
	Model       string `json:"model"`
	Category    string `json:"category"`
	Online      bool   `json:"isOnline"`
}

type Status struct {
	Code  string `json:"code"`
	Value any    `json:"value"`
}

type Function struct {
	Code   string `json:"code"`
	Type   string `json:"type"`
	Values string `json:"values"`
}

type Command struct {
	Code  string `json:"code"`
	Value any    `json:"value"`
}

func NewCloudClient(cfg Config) (*CloudClient, error) {
	host, err := hostForRegion(cfg.Region)
	if err != nil {
		return nil, err
	}
	return &CloudClient{
		cfg:  cfg,
		host: host,
		http: &http.Client{Timeout: 20 * time.Second},
	}, nil
}

func (c *CloudClient) Test(ctx context.Context) error {
	_, err := c.getToken(ctx)
	return err
}

func (c *CloudClient) ListDevices(ctx context.Context) ([]DeviceInfo, error) {
	var out struct {
		Success bool         `json:"success"`
		Code    int          `json:"code"`
		Msg     string       `json:"msg"`
		Result  []DeviceInfo `json:"result"`
	}
	if err := c.do(ctx, http.MethodGet, "/v2.0/cloud/thing/device?page_size=20", nil, &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("list tuya devices: code=%d msg=%s", out.Code, out.Msg)
	}
	return out.Result, nil
}

func (c *CloudClient) DeviceStatus(ctx context.Context, deviceID string) ([]Status, error) {
	var out struct {
		Success bool     `json:"success"`
		Code    int      `json:"code"`
		Msg     string   `json:"msg"`
		Result  []Status `json:"result"`
	}
	if err := c.do(ctx, http.MethodGet, "/v1.0/devices/"+url.PathEscape(deviceID)+"/status", nil, &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("get tuya status: code=%d msg=%s", out.Code, out.Msg)
	}
	return out.Result, nil
}

func (c *CloudClient) DeviceFunctions(ctx context.Context, deviceID string) ([]Function, error) {
	var out struct {
		Success bool   `json:"success"`
		Code    int    `json:"code"`
		Msg     string `json:"msg"`
		Result  struct {
			Functions []Function `json:"functions"`
		} `json:"result"`
	}
	if err := c.do(ctx, http.MethodGet, "/v1.0/devices/"+url.PathEscape(deviceID)+"/functions", nil, &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("get tuya functions: code=%d msg=%s", out.Code, out.Msg)
	}
	return out.Result.Functions, nil
}

func (c *CloudClient) SendCommands(ctx context.Context, deviceID string, commands []Command) error {
	body, err := json.Marshal(map[string]any{"commands": commands})
	if err != nil {
		return err
	}
	var out struct {
		Success bool   `json:"success"`
		Code    int    `json:"code"`
		Msg     string `json:"msg"`
		Result  bool   `json:"result"`
	}
	if err := c.do(ctx, http.MethodPost, "/v1.0/devices/"+url.PathEscape(deviceID)+"/commands", body, &out); err != nil {
		return err
	}
	if !out.Success {
		return fmt.Errorf("send tuya command: code=%d msg=%s", out.Code, out.Msg)
	}
	return nil
}

func (c *CloudClient) do(ctx context.Context, method, path string, body []byte, out any) error {
	token, err := c.getToken(ctx)
	if err != nil {
		return err
	}
	req, err := c.newSignedRequest(ctx, method, path, body, token)
	if err != nil {
		return err
	}
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
		return fmt.Errorf("tuya HTTP %d: %s", resp.StatusCode, string(data))
	}
	if err := json.Unmarshal(data, out); err != nil {
		return fmt.Errorf("decode tuya response: %w", err)
	}
	return nil
}

func (c *CloudClient) getToken(ctx context.Context) (string, error) {
	if c.token != "" {
		return c.token, nil
	}
	req, err := c.newSignedRequest(ctx, http.MethodGet, "/v1.0/token?grant_type=1", nil, "")
	if err != nil {
		return "", err
	}
	var out struct {
		Success bool   `json:"success"`
		Code    int    `json:"code"`
		Msg     string `json:"msg"`
		Result  struct {
			AccessToken string `json:"access_token"`
		} `json:"result"`
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if err := json.Unmarshal(data, &out); err != nil {
		return "", fmt.Errorf("decode tuya token response: %w", err)
	}
	if !out.Success {
		return "", fmt.Errorf("tuya token request failed: code=%d msg=%s", out.Code, out.Msg)
	}
	c.token = out.Result.AccessToken
	return c.token, nil
}

func (c *CloudClient) newSignedRequest(ctx context.Context, method, path string, body []byte, token string) (*http.Request, error) {
	if c.cfg.AccessID == "" || c.cfg.AccessSecret == "" {
		return nil, errors.New("tuya access id and secret are required")
	}
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.host+path, reader)
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

func (c *CloudClient) sign(req *http.Request, body []byte, token, timestamp string) string {
	stringToSign := req.Method + "\n" + sha256Hex(body) + "\n\n" + canonicalURI(req.URL)
	payload := c.cfg.AccessID + token + timestamp + stringToSign
	return strings.ToUpper(hmacSHA256Hex(payload, c.cfg.AccessSecret))
}

func hostForRegion(region string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(region)) {
	case "eu", "eu-central":
		return "https://openapi.tuyaeu.com", nil
	case "us":
		return "https://openapi.tuyaus.com", nil
	case "cn":
		return "https://openapi.tuyacn.com", nil
	case "in":
		return "https://openapi.tuyain.com", nil
	default:
		return "", fmt.Errorf("unsupported tuya region %q", region)
	}
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
