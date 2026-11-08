package dreame

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/md5"
	"crypto/rand"
	"encoding/base64"
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

const (
	appKey           = "EETjszu*XI5znHsI"
	passwordSalt     = "RAylYC%fmSKp7%Tq"
	maxResponseBytes = 4 << 20
)

type cloudClient struct {
	http     *http.Client
	base     string
	email    string
	token    string
	tenant   string
	region   string
	language string
	country  string
	visitor  string
	secrets  []string
}

type response struct {
	Code    json.RawMessage `json:"code"`
	Success *bool           `json:"success"`
	Data    json.RawMessage `json:"data"`
}

func md5String(s string) string {
	sum := md5.Sum([]byte(s))
	return hex.EncodeToString(sum[:])
}

func (c *cloudClient) headers() http.Header {
	h := make(http.Header)
	h.Set("User-Agent", "Dart/3.9 (dart:io)")
	h.Set("Authorization", "Basic ZHJlYW1lX2FwcHYxOkFQXmR2QHpAU1FZVnhOODg=")
	h.Set("Tenant-Id", "000000")
	if c.tenant != "" {
		h.Set("Tenant-Id", c.tenant)
	}
	h.Set("Dreame-Meta", "cv=a_102060300;canvasHash="+md5String(c.email + "c")[:8]+";webglHash="+md5String(c.email + "w")[:8]+";visitorIdHash="+c.visitor)
	if c.token != "" {
		h.Set("Dreame-Auth", c.token)
	}
	if c.region != "" && c.language != "" && c.country != "" {
		plain := []byte(c.region + "|" + c.language + "|" + c.country)
		padding := aes.BlockSize - len(plain)%aes.BlockSize
		plain = append(plain, bytes.Repeat([]byte{byte(padding)}, padding)...)
		block, _ := aes.NewCipher([]byte(appKey))
		for i := 0; i < len(plain); i += aes.BlockSize {
			block.Encrypt(plain[i:i+aes.BlockSize], plain[i:i+aes.BlockSize])
		}
		h.Set("Dreame-Rlc", base64.StdEncoding.EncodeToString(plain))
	}
	return h
}

func (c *cloudClient) request(ctx context.Context, path, contentType string, body []byte) (json.RawMessage, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.base+path, bytes.NewReader(body))
	if err != nil {
		return nil, errors.New("could not prepare Dreame request")
	}
	req.Header = c.headers()
	req.Header.Set("Content-Type", contentType)
	res, err := c.http.Do(req)
	if err != nil {
		if ctx.Err() != nil {
			return nil, errors.New("Dreame read was cancelled or its time limit was reached")
		}
		return nil, errors.New("could not reach Dreame cloud; check connectivity and server region")
	}
	defer func() { _ = res.Body.Close() }()
	data, err := io.ReadAll(io.LimitReader(res.Body, maxResponseBytes+1))
	if err != nil {
		return nil, errors.New("could not read Dreame response")
	}
	if len(data) > maxResponseBytes {
		return nil, errors.New("Dreame response exceeds the 4 MiB diagnostic limit")
	}
	if !json.Valid(data) {
		return nil, fmt.Errorf("Dreame returned HTTP %d without a JSON response", res.StatusCode)
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return data, fmt.Errorf("Dreame returned HTTP %d", res.StatusCode)
	}
	var envelope response
	if err := json.Unmarshal(data, &envelope); err != nil {
		return data, errors.New("Dreame returned an unexpected response shape")
	}
	if len(envelope.Code) > 0 && safeCode(envelope.Code) != "0" && safeCode(envelope.Code) != "200" && string(envelope.Code) != "null" {
		return data, fmt.Errorf("Dreame returned code %s", safeCode(envelope.Code))
	}
	if envelope.Success != nil && !*envelope.Success {
		return data, errors.New("Dreame rejected this read")
	}
	return data, nil
}

func safeCode(raw json.RawMessage) string {
	value := strings.Trim(string(raw), `"`)
	if _, err := strconv.Atoi(value); err != nil {
		return "unknown"
	}
	return value
}

func (c *cloudClient) login(ctx context.Context, password string) (json.RawMessage, error) {
	hash := md5String(password + passwordSalt)
	c.secrets = []string{password, hash}
	data, err := c.request(ctx, "/dreame-auth/oauth/token", "application/x-www-form-urlencoded", []byte(url.Values{
		"grant_type": {"password"}, "scope": {"all"}, "platform": {"ANDROID"}, "type": {"account"}, "username": {c.email}, "password": {hash},
	}.Encode()))
	if err != nil {
		return data, err
	}
	var auth struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		Tenant       string `json:"tenant_id"`
		Region       string `json:"region"`
		Language     string `json:"lang"`
		Country      string `json:"country"`
	}
	if json.Unmarshal(data, &auth) != nil || auth.AccessToken == "" {
		return data, errors.New("Dreame did not issue an authentication token; check the app email, password and server region")
	}
	c.token = auth.AccessToken
	c.tenant = auth.Tenant
	c.region = auth.Region
	c.language = auth.Language
	c.country = auth.Country
	c.secrets = append(c.secrets, auth.AccessToken, auth.RefreshToken)
	return data, nil
}

func (c *cloudClient) read(ctx context.Context, path string, params json.RawMessage) (json.RawMessage, error) {
	var body []byte
	if len(params) > 0 {
		var err error
		body, err = signPayload(params, time.Now().UnixMilli())
		if err != nil {
			return nil, errors.New("could not sign Dreame read")
		}
	}
	return c.request(ctx, path, "application/json", body)
}

func signPayload(raw json.RawMessage, timestamp int64) ([]byte, error) {
	var params map[string]json.RawMessage
	if err := json.Unmarshal(raw, &params); err != nil {
		return nil, err
	}
	canonical, err := splice(params, true)
	if err != nil {
		return nil, err
	}
	params["sign"], _ = json.Marshal(md5String(canonical + strconv.FormatInt(timestamp, 10) + appKey))
	params["timestamp"] = json.RawMessage(strconv.FormatInt(timestamp, 10))
	return marshalJSON(params)
}

func splice(params map[string]json.RawMessage, top bool) (string, error) {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var parts []string
	for _, k := range keys {
		v := bytes.TrimSpace(params[k])
		if len(v) == 0 {
			return "", errors.New("empty JSON value")
		}
		switch v[0] {
		case '{':
			var child map[string]json.RawMessage
			if err := json.Unmarshal(v, &child); err != nil {
				return "", err
			}
			inner, err := splice(child, false)
			if err != nil {
				return "", err
			}
			if inner == "" {
				parts = append(parts, k+"=]")
			} else {
				parts = append(parts, k+"=["+inner+"]")
			}
		case '[':
			if top {
				value, err := canonicalJSON(v)
				if err != nil {
					return "", err
				}
				parts = append(parts, k+"="+string(value))
			}
		case '"':
			var value string
			if err := json.Unmarshal(v, &value); err != nil {
				return "", err
			}
			if !top {
				encoded, _ := marshalJSON(value)
				value = string(encoded)
			}
			parts = append(parts, k+"="+value)
		default:
			parts = append(parts, k+"="+string(v))
		}
	}
	return strings.Join(parts, "&"), nil
}

func canonicalJSON(raw json.RawMessage) ([]byte, error) {
	var value any
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.UseNumber()
	if err := decoder.Decode(&value); err != nil {
		return nil, err
	}
	return marshalJSON(value)
}

func marshalJSON(value any) ([]byte, error) {
	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	encoder.SetEscapeHTML(false)
	if err := encoder.Encode(value); err != nil {
		return nil, err
	}
	return bytes.TrimSpace(buf.Bytes()), nil
}

func newClient(httpClient *http.Client, base, email string) *cloudClient {
	var visitor [16]byte
	_, _ = rand.Read(visitor[:])
	return &cloudClient{http: httpClient, base: base, email: email, visitor: hex.EncodeToString(visitor[:])}
}
