package assistant

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"syscall"
)

// CLIRunner launches isolated Claude invocations with only Hive tools.
type CLIRunner struct{ Binary string }

type cliContent struct {
	Type   string    `json:"type"`
	Text   string    `json:"text,omitempty"`
	Source *cliImage `json:"source,omitempty"`
}
type cliImage struct {
	Type      string `json:"type"`
	MediaType string `json:"media_type"`
	Data      string `json:"data"`
}
type cliMessage struct {
	Role    string       `json:"role"`
	Content []cliContent `json:"content"`
}
type cliInput struct {
	Type    string     `json:"type"`
	Message cliMessage `json:"message"`
	Parent  *string    `json:"parent_tool_use_id"`
}
type cliEvent struct {
	Type       string          `json:"type"`
	Subtype    string          `json:"subtype"`
	Result     string          `json:"result"`
	IsError    bool            `json:"is_error"`
	CostUSD    float64         `json:"total_cost_usd"`
	Structured json.RawMessage `json:"structured_output"`
	Event      struct {
		Type  string `json:"type"`
		Delta struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"delta"`
	} `json:"event"`
	ErrorStatus int `json:"error_status"`
}

func cliArgs(inv Invocation) ([]string, error) {
	args := []string{"-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--model", inv.Model, "--tools", "", "--strict-mcp-config", "--no-session-persistence", "--permission-mode", "dontAsk", "--setting-sources", "", "--max-turns", "32", "--system-prompt", inv.System}
	if inv.JSONSchema != "" {
		args = append(args, "--json-schema", inv.JSONSchema)
	}
	if inv.MCPURL != "" {
		type server struct {
			Type    string            `json:"type"`
			URL     string            `json:"url"`
			Headers map[string]string `json:"headers"`
		}
		config := struct {
			Servers map[string]server `json:"mcpServers"`
		}{map[string]server{"hive": {Type: "http", URL: inv.MCPURL, Headers: map[string]string{"Authorization": "Bearer " + inv.MCPToken}}}}
		b, err := json.Marshal(config)
		if err != nil {
			return nil, err
		}
		args = append(args, "--mcp-config", string(b), "--allowedTools", "mcp__hive__*")
	}
	return args, nil
}

func (r *CLIRunner) Run(ctx context.Context, inv Invocation) (Result, error) {
	args, err := cliArgs(inv)
	if err != nil {
		return Result{}, err
	}
	cmd, cleanup, err := r.command(ctx, inv.Token, args)
	if err != nil {
		return Result{}, err
	}
	defer cleanup()
	content := []cliContent{{Type: "text", Text: inv.Prompt}}
	for _, a := range inv.Images {
		content = append(content, cliContent{Type: "image", Source: &cliImage{Type: "base64", MediaType: a.MIME, Data: base64.StdEncoding.EncodeToString(a.Content)}})
	}
	input, err := json.Marshal(cliInput{Type: "user", Message: cliMessage{Role: "user", Content: content}})
	if err != nil {
		return Result{}, err
	}
	cmd.Stdin = bytes.NewReader(append(input, '\n'))
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return Result{}, err
	}
	if err = cmd.Start(); err != nil {
		return Result{}, fmt.Errorf("Claude CLI is unavailable: %w", err)
	}
	var result Result
	gotResult := false
	var streamErr error
	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 65536), 8<<20)
	for scanner.Scan() {
		var e cliEvent
		if err := json.Unmarshal(scanner.Bytes(), &e); err != nil {
			streamErr = errors.New("Claude returned invalid stream data")
			_ = cmd.Cancel()
			break
		}
		switch e.Type {
		case "stream_event":
			if e.Event.Delta.Type == "text_delta" && inv.OnText != nil {
				inv.OnText(e.Event.Delta.Text)
			}
		case "system":
			if e.Subtype == "api_retry" {
				if e.ErrorStatus == 401 || e.ErrorStatus == 403 {
					streamErr = ErrClaudeAuthentication
					_ = cmd.Cancel()
				} else if inv.OnActivity != nil {
					inv.OnActivity("retrying")
				}
			}
		case "result":
			gotResult = true
			result = Result{Text: e.Result, Structured: e.Structured, CostUSD: e.CostUSD}
			if e.IsError || e.Subtype != "success" {
				streamErr = fmt.Errorf("Claude request failed (%s)", e.Subtype)
			}
		}
	}
	if scanner.Err() != nil {
		streamErr = errors.New("Claude output exceeded the stream limit or could not be read")
		_ = cmd.Cancel()
	}
	waitErr := cmd.Wait()
	if ctx.Err() != nil {
		return result, ctx.Err()
	}
	if streamErr != nil {
		return result, streamErr
	}
	if waitErr != nil || !gotResult {
		return result, errors.New("Claude ended without completing the response")
	}
	result.Text = strings.TrimSpace(result.Text)
	return result, nil
}

var ErrClaudeAuthentication = errors.New("Claude rejected the token; update the Claude integration")

func (r *CLIRunner) command(ctx context.Context, token string, args []string) (*exec.Cmd, func(), error) {
	dir, err := os.MkdirTemp("", "hive-assistant-")
	if err != nil {
		return nil, nil, err
	}
	binary := r.Binary
	if binary == "" {
		binary = "claude"
	}
	cmd := exec.CommandContext(ctx, binary, args...)
	cmd.Dir = dir
	cmd.Env = []string{"PATH=" + os.Getenv("PATH"), "HOME=" + dir, "CLAUDE_CODE_OAUTH_TOKEN=" + token, "DISABLE_AUTOUPDATER=1", "DISABLE_TELEMETRY=1", "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1", "USE_BUILTIN_RIPGREP=0"}
	cmd.Stderr = io.Discard
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error { return syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL) }
	return cmd, func() { _ = os.RemoveAll(dir) }, nil
}
