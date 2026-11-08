package dreame

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestProbeReadsDeviceWithoutWritesOrCredentialExposure(t *testing.T) {
	var propertyReads atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method != http.MethodPost {
			t.Errorf("unexpected HTTP method: %s", r.Method)
		}
		if r.URL.Path == "/dreame-auth/oauth/token" {
			if err := r.ParseForm(); err != nil {
				t.Error(err)
			}
			if r.Form.Get("username") != "owner@example.com" || r.Form.Get("password") != md5String("private-password"+passwordSalt) {
				t.Error("login did not use the app credential format")
			}
			_, _ = w.Write([]byte(`{"access_token":"private-access-token","refresh_token":"private-refresh-token","expires_in":7200,"region":"eu","lang":"en","country":"SE","tenant_id":"000000"}`))
			return
		}
		if r.Header.Get("Dreame-Auth") != "private-access-token" || r.Header.Get("Dreame-Rlc") == "" {
			t.Error("authenticated app headers missing")
		}
		switch r.URL.Path {
		case "/dreame-user-iot/iotuserbind/device/listV2":
			_, _ = w.Write([]byte(`{"code":0,"data":{"page":{"current":"1","size":"100","pages":"1","total":"1","records":[{"did":1234567890,"model":"dreame.vacuum.r2423","customName":"Kitchen vacuum","masterUid":98765,"bindDomain":"10000.mt.eu.iot.dreame.tech:19973","property":"{\"iotId\":\"private-stream-key\",\"battery\":84}"}]}}}`))
		case "/dreame-user-iot/iotuserbind/device/info":
			_, _ = w.Write([]byte(`{"code":0,"data":{"ver":"4.3.9","local_key":"private-local-key","clientKey":"private-client-key","property":"{\"token\":\"nested-private-token\",\"battery\":84}"}}`))
		case "/dreame-user-iot/iotstatus/devOTCInfo":
			_, _ = w.Write([]byte(`{"code":0,"data":{"localIp":"192.168.1.42","rssi":-54}}`))
		case "/dreame-user-iot/iotstatus/props":
			_, _ = w.Write([]byte(`{"code":"0","data":{"battery":84,"status":"charging","link":"https://bucket.example/file?Signature=private-signature"}}`))
		case "/dreame-user-iot/iotstatus/history":
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"code":404,"message":"History unavailable"}`))
		case "/dreame-iot-com-10000/device/sendCommand":
			var request struct {
				Data struct {
					Method string            `json:"method"`
					Params []propertyRequest `json:"params"`
				} `json:"data"`
				Sign string `json:"sign"`
			}
			if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
				t.Error(err)
			}
			if request.Data.Method != "get_properties" {
				t.Errorf("probe issued a device write: %s", request.Data.Method)
			}
			if len(request.Data.Params) > 15 || len(request.Data.Params) == 0 || request.Sign == "" {
				t.Error("property read was not signed and batched")
			}
			propertyReads.Add(int32(len(request.Data.Params)))
			results := make([]json.RawMessage, 0, len(request.Data.Params))
			for _, p := range request.Data.Params {
				if p.SIID == 13 {
					results = append(results, json.RawMessage(fmt.Sprintf(`{"did":%q,"siid":13,"code":-1}`, p.DID)))
					continue
				}
				code := 0
				if p.SIID == 5 {
					code = -4001
				}
				results = append(results, json.RawMessage(fmt.Sprintf(`{"siid":%d,"piid":%d,"code":%d,"value":84}`, p.SIID, p.PIID, code)))
			}
			encoded, _ := json.Marshal(results)
			_, _ = fmt.Fprintf(w, `{"code":0,"data":{"result":%s}}`, encoded)
		default:
			t.Errorf("unexpected endpoint: %s", r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()
	p := NewProbe()
	p.baseURL = func(region string) string {
		if region != "eu" {
			t.Errorf("region = %s", region)
		}
		return server.URL
	}
	report, err := p.Inspect(t.Context(), Credentials{Email: " owner@example.com ", Password: "private-password", Region: "EU"})
	if err != nil {
		t.Fatal(err)
	}
	if !report.Authenticated || report.CompletedAt.IsZero() || len(report.Devices) != 1 {
		t.Fatalf("incomplete report: %+v", report)
	}
	d := report.Devices[0]
	if d.ID != "1234567890" || d.Model != "dreame.vacuum.r2423" || d.Name != "Kitchen vacuum" {
		t.Fatalf("device identity = %+v", d)
	}
	if int(propertyReads.Load()) != len(propertyCatalog) || len(d.Properties) != len(propertyCatalog) {
		t.Fatal("probe did not finish all known property reads")
	}
	if d.Properties[0].Name != "STATE" || d.Properties[0].Value != "84" {
		t.Fatalf("unlabelled property: %+v", d.Properties[0])
	}
	unsupported := false
	mapSaving := false
	for _, p := range d.Properties {
		if p.Code == -4001 {
			unsupported = true
		}
		if p.Name == "MAP_SAVING" && p.SIID == 13 && p.PIID == 1 && p.Code == -1 {
			mapSaving = true
		}
	}
	if !unsupported {
		t.Error("unsupported property responses disappeared")
	}
	if !mapSaving {
		t.Error("property with an omitted wire identifier lost its requested identity")
	}
	historyFailure := false
	for _, read := range d.Reads {
		if strings.HasPrefix(read.Name, "Cleaning history") && read.Error != nil {
			historyFailure = true
		}
	}
	if !historyFailure {
		t.Error("partial endpoint failure disappeared")
	}
	encoded, _ := json.Marshal(report)
	for _, secret := range []string{"private-password", "private-access-token", "private-refresh-token", "private-stream-key", "private-local-key", "private-client-key", "nested-private-token", "private-signature"} {
		if strings.Contains(string(encoded), secret) {
			t.Errorf("report exposed %s", secret)
		}
	}
	if !strings.Contains(string(encoded), "battery") || !strings.Contains(string(encoded), "192.168.1.42") {
		t.Error("diagnostic data was removed with secrets")
	}
}

func TestProbeAuthenticationFailureIsInspectable(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error_description":"Invalid password: private-password","refresh_token":"private-token"}`))
	}))
	defer server.Close()
	p := NewProbe()
	p.baseURL = func(string) string { return server.URL }
	report, err := p.Inspect(t.Context(), Credentials{"owner@example.com", "private-password", "eu"})
	if err != nil {
		t.Fatal(err)
	}
	if requests.Load() != 1 || report.Authenticated || len(report.Devices) != 0 || report.Reads[0].Error == nil {
		t.Fatal("failed login should stop discovery and retain diagnostics")
	}
	if strings.Contains(report.Reads[0].JSON, "private-password") || strings.Contains(report.Reads[0].JSON, "private-token") {
		t.Fatal("failed login response leaked credentials")
	}
}

func TestProbeRejectsInvalidCredentialsBeforeConnecting(t *testing.T) {
	p := NewProbe()
	p.baseURL = func(string) string { t.Fatal("invalid input reached cloud"); return "" }
	for _, input := range []Credentials{{"owner@example.com", "secret", "../../example.com"}, {"owner@example.com", "", "eu"}, {"not an email", "secret", "eu"}} {
		if _, err := p.Inspect(t.Context(), input); err == nil {
			t.Error("invalid input accepted")
		}
	}
}

func TestProbeCancellationStopsCloudRequest(t *testing.T) {
	started := make(chan struct{})
	release := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.Copy(io.Discard, r.Body)
		close(started)
		select {
		case <-r.Context().Done():
		case <-release:
		}
	}))
	defer server.Close()
	defer close(release)
	p := NewProbe()
	p.baseURL = func(string) string { return server.URL }
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	done := make(chan error, 1)
	go func() { _, err := p.Inspect(ctx, Credentials{"owner@example.com", "secret", "eu"}); done <- err }()
	<-started
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("cancelled probe kept running")
	}
}

func TestSignPayloadMatchesDreameAppCanonicalization(t *testing.T) {
	const input = `{"did":"robot-42","id":100,"data":{"did":"robot-42","id":100,"method":"get_properties","params":[{"did":"0","siid":2,"piid":1}]}}`
	raw, err := signPayload(json.RawMessage(input), 1794000000000)
	if err != nil {
		t.Fatal(err)
	}
	var signed struct {
		Sign      string `json:"sign"`
		Timestamp int64  `json:"timestamp"`
	}
	if err := json.Unmarshal(raw, &signed); err != nil {
		t.Fatal(err)
	}
	if signed.Sign != "fb9058b8e229eb814aa4bdfdd70bba91" || signed.Timestamp != 1794000000000 {
		t.Fatalf("wire signature differs from protocol fixture: %+v", signed)
	}
}
