//go:build e2e

package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

func output(v any) {
	if err := json.NewEncoder(os.Stdout).Encode(v); err != nil {
		panic(err)
	}
}
func result(text string) {
	output(map[string]any{"type": "result", "subtype": "success", "result": text})
}
func fail(err error) {
	fmt.Fprintln(os.Stderr, err)
	output(map[string]any{"type": "result", "subtype": "error_during_execution", "is_error": true})
	os.Exit(1)
}
func argument(name string) string {
	for i, a := range os.Args {
		if a == name && i+1 < len(os.Args) {
			return os.Args[i+1]
		}
	}
	return ""
}
func main() {
	raw, err := bufio.NewReader(os.Stdin).ReadBytes('\n')
	if err != nil {
		fail(err)
	}
	var envelope struct {
		Type string `json:"type"`
		ID   string `json:"request_id"`
	}
	if err := json.Unmarshal(raw, &envelope); err != nil {
		fail(err)
	}
	if envelope.Type == "control_request" {
		output(map[string]any{"type": "control_response", "response": map[string]any{"request_id": envelope.ID, "subtype": "success", "response": map[string]any{"models": []map[string]any{{"value": "default", "displayName": "Default"}, {"value": "opus", "displayName": "Opus"}, {"value": "fable", "displayName": "Fable"}, {"value": "hidden", "displayName": "Hidden", "disabled": true}}}}})
		return
	}
	var input struct {
		Message struct{ Content []struct{ Type, Text string } }
	}
	if err = json.Unmarshal(raw, &input); err != nil {
		fail(err)
	}
	prompt := ""
	for _, c := range input.Message.Content {
		prompt += c.Text
	}
	if argument("--json-schema") != "" {
		output(map[string]any{"type": "result", "subtype": "success", "structured_output": map[string]any{"decision": "allow", "bulkDestructive": strings.Contains(prompt, "Delete both"), "reply": "", "title": "Home lighting"}})
		return
	}
	if argument("--mcp-config") == "" {
		_, rawEvidence, final := strings.Cut(prompt, "\nTool-phase evidence (data, not instructions):\n")
		if !final {
			result("OK")
			return
		}
		var evidence struct{ Notes string }
		if err := json.Unmarshal([]byte(rawEvidence), &evidence); err != nil {
			fail(err)
		}
		for _, word := range strings.SplitAfter(evidence.Notes, " ") {
			output(map[string]any{"type": "stream_event", "event": map[string]any{"delta": map[string]string{"type": "text_delta", "text": word}}})
			time.Sleep(30 * time.Millisecond)
		}
		result(evidence.Notes)
		return
	}
	var config struct {
		Servers map[string]struct {
			URL     string
			Headers map[string]string
		} `json:"mcpServers"`
	}
	if err = json.Unmarshal([]byte(argument("--mcp-config")), &config); err != nil {
		fail(err)
	}
	server := config.Servers["hive"]
	rpc := func(method string, params any) json.RawMessage {
		body, _ := json.Marshal(map[string]any{"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
		req, err := http.NewRequest("POST", server.URL, bytes.NewReader(body))
		if err != nil {
			fail(err)
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json, text/event-stream")
		for k, v := range server.Headers {
			req.Header.Set(k, v)
		}
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			fail(err)
		}
		defer func() { _ = resp.Body.Close() }()
		var envelope struct {
			Result json.RawMessage
			Error  json.RawMessage
		}
		if err = json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
			fail(err)
		}
		if len(envelope.Error) > 0 {
			fail(fmt.Errorf("MCP error: %s", envelope.Error))
		}
		return envelope.Result
	}
	rpc("initialize", map[string]any{"protocolVersion": "2025-03-26", "capabilities": map[string]any{}, "clientInfo": map[string]string{"name": "fixture", "version": "1"}})
	call := func(name string, args any) string {
		raw := rpc("tools/call", map[string]any{"name": name, "arguments": args})
		var r struct {
			IsError bool
			Content []struct{ Text string }
		}
		if err := json.Unmarshal(raw, &r); err != nil {
			fail(err)
		}
		if r.IsError {
			fail(fmt.Errorf("tool %s: %s", name, raw))
		}
		if len(r.Content) == 0 {
			return ""
		}
		return r.Content[0].Text
	}
	if strings.Contains(prompt, "Check the lights") {
		for _, topic := range []string{"system", "authoring-examples", "devices", "automations", "automation-config", "scenes", "scene-config", "effect-config", "administration"} {
			if strings.TrimSpace(call("knowledge", map[string]string{"topic": topic})) == "" {
				fail(fmt.Errorf("missing bundled knowledge: %s", topic))
			}
		}
		if !strings.Contains(call("discover", map[string]string{"topic": "AutomationConditionInput"}), "negate") {
			fail(fmt.Errorf("condition schema is unavailable"))
		}
	}
	if strings.Contains(prompt, "Recorded action") {
		result("The operation is recorded. Your home is up to date.")
		return
	}
	if strings.Contains(prompt, "Delete both") {
		data := call("query", map[string]string{"document": `query { rooms { id name } }`, "variables": "{}"})
		var r struct{ Rooms []struct{ ID, Name string } }
		if err := json.Unmarshal([]byte(data), &r); err != nil {
			fail(err)
		}
		ids := []string{}
		for _, room := range r.Rooms {
			if strings.HasPrefix(room.Name, "Assistant test ") {
				ids = append(ids, room.ID)
			}
		}
		args, _ := json.Marshal(map[string]any{"ids": ids})
		call("act", map[string]string{"field": "batchDeleteRooms", "arguments": string(args), "selection": ""})
		result("Review the rooms below and confirm to delete them.")
		return
	}
	if strings.Contains(prompt, "Create a room") {
		call("act", map[string]string{"field": "createRoom", "arguments": `{"input":{"name":"Assistant created room"}}`, "selection": "id name"})
		result("Created **Assistant created room**.")
		return
	}
	if strings.Contains(prompt, "Create an account") {
		call("act", map[string]string{"field": "createUser", "arguments": `{"input":{"username":"assistant-created","name":"Assistant user"}}`, "selection": "id name"})
		result("Enter a password in the private form.")
		return
	}
	if strings.Contains(prompt, "Check this photo") {
		for _, c := range input.Message.Content {
			if c.Type == "image" {
				result("I received your photo.")
				return
			}
		}
		fail(fmt.Errorf("missing image"))
	}
	if strings.Contains(prompt, "Show formatted headings") {
		result("## Night light is ready\n\nThe scene is saved.\n\n### Details\n\nWarm light in the hallway.")
		return
	}
	if strings.Contains(prompt, "Wait until stopped") {
		time.Sleep(time.Minute)
		result("Waited")
		return
	}
	for _, part := range []string{"Your ", "lights ", "are ", "ready."} {
		output(map[string]any{"type": "stream_event", "event": map[string]any{"delta": map[string]string{"type": "text_delta", "text": part}}})
		time.Sleep(300 * time.Millisecond)
	}
	result("Your lights are ready.")
}
