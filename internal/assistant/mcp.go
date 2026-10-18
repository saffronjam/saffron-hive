package assistant

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/saffronjam/saffron-hive/internal/auth"
)

type grant struct {
	observations   []string
	principal      auth.Principal
	conversationID string
	runID          string
	server         *mcp.Server
	mu             sync.Mutex
}

type ToolServer struct {
	service  *Service
	mu       sync.Mutex
	grants   map[string]*grant
	listener net.Listener
}

func NewToolServer(s *Service) *ToolServer {
	return &ToolServer{service: s, grants: make(map[string]*grant)}
}
func (t *ToolServer) Start(ctx context.Context) error {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return err
	}
	t.listener = listener
	handler := mcp.NewStreamableHTTPHandler(func(r *http.Request) *mcp.Server {
		g := t.lookup(r)
		if g == nil {
			return nil
		}
		return g.server
	}, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true})
	server := &http.Server{ReadHeaderTimeout: 10 * time.Second, Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		g := t.lookup(r)
		if g == nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 2<<20)
		handler.ServeHTTP(w, r.WithContext(auth.WithPrincipal(r.Context(), g.principal)))
	})}
	go func() {
		if err := server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("Assistant tool server stopped", "error", err)
		}
	}()
	go func() { <-ctx.Done(); _ = server.Close() }()
	return nil
}
func (t *ToolServer) lookup(r *http.Request) *grant {
	token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
	if !ok {
		return nil
	}
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.grants[token]
}
func (t *ToolServer) Issue(p auth.Principal, conversationID, runID string) (string, string, func()) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	token := hex.EncodeToString(b)
	g := &grant{principal: p, conversationID: conversationID, runID: runID, server: mcp.NewServer(&mcp.Implementation{Name: "hive", Version: "1"}, nil)}
	t.register(g)
	t.mu.Lock()
	t.grants[token] = g
	t.mu.Unlock()
	return "http://" + t.listener.Addr().String() + "/mcp", token, func() { t.mu.Lock(); delete(t.grants, token); t.mu.Unlock() }
}
func toolText(value string) *mcp.CallToolResult {
	return &mcp.CallToolResult{Content: []mcp.Content{&mcp.TextContent{Text: value}}}
}

type topicInput struct {
	Topic string `json:"topic" jsonschema:"Topic name, GraphQL type name, or empty for the index"`
}
type queryInput struct {
	Document  string `json:"document"`
	Variables string `json:"variables" jsonschema:"JSON object encoded as a string, or {}"`
}
type actionInput struct {
	Field        string `json:"field"`
	Arguments    string `json:"arguments" jsonschema:"GraphQL argument object encoded as JSON. Omit secrets to request a private input card."`
	Selection    string `json:"selection" jsonschema:"Return selection without outer braces, or empty for the default"`
	AttachmentID string `json:"attachmentId,omitempty"`
}
type idInput struct {
	ID string `json:"id"`
}

func (t *ToolServer) register(g *grant) {
	check := func(ctx context.Context) error {
		_, err := t.service.toolAccess(ctx, g.principal, g.conversationID, g.runID, false)
		return err
	}
	mcp.AddTool(g.server, &mcp.Tool{Name: "discover", Description: "Discover Hive GraphQL operations and the exact input/output type definitions. Empty topic lists available operations; supply a type name for its fields."}, func(ctx context.Context, _ *mcp.CallToolRequest, in topicInput) (*mcp.CallToolResult, any, error) {
		if err := check(ctx); err != nil {
			return nil, nil, err
		}
		v, err := t.service.gateway.Discover(ctx, in.Topic)
		return toolText(v), nil, err
	})
	mcp.AddTool(g.server, &mcp.Tool{Name: "knowledge", Description: "Read the bundled Hive domain guide. Read the relevant topic before authoring scenes, effects or automations."}, func(ctx context.Context, _ *mcp.CallToolRequest, in topicInput) (*mcp.CallToolResult, any, error) {
		if err := check(ctx); err != nil {
			return nil, nil, err
		}
		v, err := knowledge(in.Topic)
		return toolText(v), nil, err
	})
	mcp.AddTool(g.server, &mcp.Tool{Name: "query", Description: "Execute a read-only Hive GraphQL query as the current user."}, func(ctx context.Context, _ *mcp.CallToolRequest, in queryInput) (*mcp.CallToolResult, any, error) {
		if err := check(ctx); err != nil {
			return nil, nil, err
		}
		t.service.activity(ctx, g.principal, g.conversationID, g.runID, "reading")
		vars := in.Variables
		if vars == "" {
			vars = "{}"
		}
		v, err := t.service.gateway.Query(ctx, in.Document, json.RawMessage(vars))
		if err == nil {
			g.mu.Lock()
			g.observations = append(g.observations, v)
			g.mu.Unlock()
		}
		return toolText(v), nil, err
	})
	for _, name := range []string{"act", "request_confirmation"} {
		force := name == "request_confirmation"
		description := "Execute one Hive mutation. Returns a fixed confirmation/private-input card when needed. When pending, explain briefly and end your response; do not poll."
		if force {
			description = "Request a fixed Hive confirmation card for a specific mutation. Hive determines scope, consequences and controls. You cannot approve it."
		}
		mcp.AddTool(g.server, &mcp.Tool{Name: name, Description: description}, func(ctx context.Context, _ *mcp.CallToolRequest, in actionInput) (*mcp.CallToolResult, any, error) {
			g.mu.Lock()
			defer g.mu.Unlock()
			args := in.Arguments
			if args == "" {
				args = "{}"
			}
			if !json.Valid([]byte(args)) {
				return nil, nil, fmt.Errorf("arguments must be a JSON object")
			}
			v, err := t.service.act(ctx, g.principal, g.conversationID, g.runID, Operation{Field: in.Field, Arguments: json.RawMessage(args), Selection: in.Selection, AttachmentID: in.AttachmentID}, force)
			return toolText(v), nil, err
		})
	}
	mcp.AddTool(g.server, &mcp.Tool{Name: "action_status", Description: "Read a previously requested action's status. This cannot approve an action. Pending actions resume the assistant automatically after the user responds."}, func(ctx context.Context, _ *mcp.CallToolRequest, in idInput) (*mcp.CallToolResult, any, error) {
		if err := check(ctx); err != nil {
			return nil, nil, err
		}
		c, err := t.service.load(ctx, g.conversationID, g.principal.ID)
		if err != nil {
			return nil, nil, err
		}
		a := findAction(c, in.ID)
		if a == nil {
			return nil, nil, errors.New("action is unavailable")
		}
		return toolText(actionResponse(*a)), nil, nil
	})

	mcp.AddTool(g.server, &mcp.Tool{Name: "view_attachment", Description: "View an image attached to this conversation, including images from earlier messages."}, func(ctx context.Context, _ *mcp.CallToolRequest, in idInput) (*mcp.CallToolResult, any, error) {
		if err := check(ctx); err != nil {
			return nil, nil, err
		}
		a, err := t.service.store.GetAssistantAttachment(ctx, in.ID, g.principal.ID)
		if err != nil || a.ConversationID != g.conversationID {
			return nil, nil, errors.New("attachment is unavailable")
		}
		return &mcp.CallToolResult{Content: []mcp.Content{&mcp.ImageContent{Data: a.Content, MIMEType: a.MIME}}}, nil, nil
	})
	mcp.AddTool(g.server, &mcp.Tool{Name: "attachment_photo", Description: "Get the normalized photo sample for a conversation image, for use in previewVibe and scene creation."}, func(ctx context.Context, _ *mcp.CallToolRequest, in idInput) (*mcp.CallToolResult, any, error) {
		if err := check(ctx); err != nil {
			return nil, nil, err
		}
		v, err := t.service.photo(ctx, g.principal.ID, g.conversationID, in.ID)
		return toolText(v), nil, err
	})
}

func (t *ToolServer) observations(token string) []string {
	t.mu.Lock()
	g := t.grants[token]
	t.mu.Unlock()
	if g == nil {
		return nil
	}
	g.mu.Lock()
	defer g.mu.Unlock()
	return append([]string(nil), g.observations...)
}
