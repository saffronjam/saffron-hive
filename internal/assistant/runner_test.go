package assistant

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestCLIRunnerStreamsWithIsolatedEnvironment(t *testing.T) {
	script := `#!/bin/sh
[ "$CLAUDE_CODE_OAUTH_TOKEN" = "test-token" ] || exit 2
[ -z "$ANTHROPIC_API_KEY" ] || exit 3
[ -z "$HIVE_TEST_SECRET" ] || exit 4
[ "$HOME" = "$PWD" ] || exit 5
read input
printf '%s\n' '{"type":"stream_event","event":{"delta":{"type":"text_delta","text":"Hello"}}}' '{"type":"result","subtype":"success","result":"Hello","total_cost_usd":0.01}'
`
	path := filepath.Join(t.TempDir(), "claude")
	if err := os.WriteFile(path, []byte(script), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("ANTHROPIC_API_KEY", "must-not-inherit")
	t.Setenv("HIVE_TEST_SECRET", "must-not-inherit")
	var text strings.Builder
	r := &CLIRunner{Binary: path}
	result, err := r.Run(t.Context(), Invocation{Token: "test-token", Model: "opus", Prompt: "Hello", OnText: func(v string) { text.WriteString(v) }})
	if err != nil || result.Text != "Hello" || text.String() != "Hello" {
		t.Fatalf("result %+v, %v", result, err)
	}
	args, err := cliArgs(Invocation{Model: "opus", MCPURL: "http://127.0.0.1:42/mcp", MCPToken: "grant"})
	if err != nil {
		t.Fatal(err)
	}
	joined := strings.Join(args, " ")
	for _, want := range []string{"--tools  ", "--strict-mcp-config", "--no-session-persistence", "--permission-mode dontAsk", "--setting-sources  ", "--allowedTools mcp__hive__*"} {
		if !strings.Contains(joined, want) {
			t.Fatalf("missing %q", want)
		}
	}
	for i, a := range args {
		if a == "--mcp-config" {
			if !json.Valid([]byte(args[i+1])) {
				t.Fatal("invalid MCP config")
			}
		}
	}
}
func TestCLIRunnerCancellationAndMalformedOutput(t *testing.T) {
	for _, script := range []string{"#!/bin/sh\nexec sleep 30\n", "#!/bin/sh\nprintf 'not-json\\n'\n"} {
		path := filepath.Join(t.TempDir(), "claude")
		if err := os.WriteFile(path, []byte(script), 0700); err != nil {
			t.Fatal(err)
		}
		ctx, cancel := context.WithTimeout(t.Context(), 100*time.Millisecond)
		_, err := (&CLIRunner{Binary: path}).Run(ctx, Invocation{Model: "haiku"})
		cancel()
		if err == nil {
			t.Fatal("expected error")
		}
	}
}
