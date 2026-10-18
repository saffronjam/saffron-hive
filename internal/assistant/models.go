package assistant

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"
	"unicode"
)

func validateModel(model string) error {
	if model == "" || len(model) > 200 || strings.ContainsFunc(model, func(r rune) bool { return unicode.IsSpace(r) || unicode.IsControl(r) }) {
		return errors.New("choose an available Claude model")
	}
	return nil
}

func (s *Service) Models(ctx context.Context, token string) ([]AvailableModel, error) {
	token = strings.TrimSpace(token)
	if token == "********" {
		config, err := s.store.GetClaudeConfig(ctx)
		if err != nil {
			return nil, err
		}
		if config == nil {
			return nil, errors.New("enter a Claude setup-token")
		}
		token = config.Token
	}
	if token == "" {
		return nil, errors.New("enter a Claude setup-token")
	}
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	select {
	case s.slots <- struct{}{}:
		defer func() { <-s.slots }()
	case <-ctx.Done():
		return nil, ctx.Err()
	}
	return s.runner.Models(ctx, token)
}

// Models reads Claude's initialization catalog without sending an inference request.
func (r *CLIRunner) Models(ctx context.Context, token string) (models []AvailableModel, err error) {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	args := []string{"-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose", "--no-session-persistence", "--tools", "", "--strict-mcp-config", "--mcp-config", `{"mcpServers":{}}`, "--setting-sources", "", "--settings", `{"disableAllHooks":true}`}
	cmd, cleanup, err := r.command(ctx, token, args)
	if err != nil {
		return nil, err
	}
	defer cleanup()
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	defer func() { _ = stdin.Close() }()
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	if err = cmd.Start(); err != nil {
		return nil, errors.New("Claude CLI is unavailable")
	}
	defer func() {
		_ = stdin.Close()
		_ = cmd.Cancel()
		_ = cmd.Wait()
		if ctx.Err() != nil {
			err = ctx.Err()
		}
	}()
	const requestID = "hive-model-catalog"
	request := struct {
		Type    string `json:"type"`
		ID      string `json:"request_id"`
		Request struct {
			Subtype string `json:"subtype"`
		} `json:"request"`
	}{Type: "control_request", ID: requestID}
	request.Request.Subtype = "initialize"
	if err = json.NewEncoder(stdin).Encode(request); err != nil {
		return nil, err
	}
	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 64*1024), 8*1024*1024)
	for scanner.Scan() {
		var message struct {
			Type     string `json:"type"`
			Response struct {
				ID       string `json:"request_id"`
				Subtype  string `json:"subtype"`
				Response struct {
					Models []struct {
						Value    string `json:"value"`
						Name     string `json:"displayName"`
						Resolved string `json:"resolvedModel"`
						Disabled bool   `json:"disabled"`
					} `json:"models"`
				} `json:"response"`
			} `json:"response"`
		}
		if json.Unmarshal(scanner.Bytes(), &message) != nil {
			return nil, errors.New("Claude returned invalid model data")
		}
		if message.Type != "control_response" || message.Response.ID != requestID {
			continue
		}
		if message.Response.Subtype != "success" {
			return nil, errors.New("Claude model discovery failed")
		}
		seen := map[string]bool{}
		for _, item := range message.Response.Response.Models {
			if item.Disabled || seen[item.Value] {
				continue
			}
			if validateModel(item.Value) != nil {
				return nil, errors.New("Claude returned an invalid model identifier")
			}
			name := item.Name
			if name == "" {
				name = item.Value
			}
			models = append(models, AvailableModel{ID: item.Value, Name: name, ResolvedModel: item.Resolved})
			seen[item.Value] = true
		}
		if len(models) == 0 {
			return nil, errors.New("Claude returned no available models")
		}
		return models, nil
	}
	return nil, errors.New("Claude model discovery ended without a catalog")
}
