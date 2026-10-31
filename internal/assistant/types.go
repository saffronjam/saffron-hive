// Package assistant runs private Hive conversations and mediates model actions.
package assistant

import (
	"context"
	"encoding/json"
	"time"

	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type Store interface {
	GetClaudeConfig(context.Context) (*store.ClaudeConfig, error)
	SaveClaudeConfig(context.Context, store.ClaudeConfig) error
	DeleteClaudeConfig(context.Context) error
	GetUserByID(context.Context, string) (store.User, error)
	ListAssistantConversations(context.Context, string) ([]store.AssistantConversation, error)
	GetAssistantConversation(context.Context, string, string) (store.AssistantConversation, error)
	CreateAssistantConversation(context.Context, store.AssistantConversation) error
	SaveAssistantConversation(context.Context, store.AssistantConversation) error
	DeleteAssistantConversation(context.Context, string, string) error
	ListAssistantConversationOwners(context.Context) ([]store.AssistantConversation, error)
	CreateAssistantAttachment(context.Context, store.AssistantAttachment) error
	GetAssistantAttachment(context.Context, string, string) (store.AssistantAttachment, error)
	DeleteAssistantAttachment(context.Context, string, string) error
}

type State string

const (
	Idle        State = "IDLE"
	Queued      State = "QUEUED"
	Running     State = "RUNNING"
	Waiting     State = "WAITING"
	Completed   State = "COMPLETED"
	Failed      State = "FAILED"
	Stopped     State = "STOPPED"
	Interrupted State = "INTERRUPTED"
)

type Conversation struct {
	Forms          []ChatForm `json:"forms"`
	ID             string     `json:"id"`
	AutoTitle      string     `json:"-"`
	TitleOverride  string     `json:"-"`
	Revision       int64      `json:"revision"`
	UpdatedAt      string     `json:"updatedAt"`
	Messages       []Message  `json:"messages"`
	Actions        []Action   `json:"actions"`
	Runs           []Run      `json:"runs"`
	Summary        string     `json:"summary"`
	SummaryThrough int        `json:"summaryThrough"`
}

type Message struct {
	Inputs      []ChatInput  `json:"inputs"`
	ID          string       `json:"id"`
	Role        string       `json:"role"`
	Text        string       `json:"text"`
	Attachments []Attachment `json:"attachments"`
	CreatedAt   string       `json:"createdAt"`
	RunID       string       `json:"runId"`
}

type Attachment struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	MIME string `json:"mime"`
}

type Run struct {
	ID             string   `json:"id"`
	MessageID      string   `json:"messageId"`
	State          State    `json:"state"`
	Activity       string   `json:"activity"`
	Error          string   `json:"error"`
	Model          string   `json:"model"`
	StartedAt      string   `json:"startedAt"`
	FinishedAt     string   `json:"finishedAt"`
	CostUSD        float64  `json:"costUsd"`
	TokenVersion   int64    `json:"tokenVersion"`
	BulkIntent     bool     `json:"bulkIntent"`
	DestructiveIDs []string `json:"destructiveIds"`
}

type ActionStatus string

const (
	Pending      ActionStatus = "PENDING"
	NeedsInput   ActionStatus = "NEEDS_INPUT"
	Executing    ActionStatus = "EXECUTING"
	Done         ActionStatus = "COMPLETED"
	Rejected     ActionStatus = "REJECTED"
	Stale        ActionStatus = "STALE"
	ActionFailed ActionStatus = "FAILED"
)

type Action struct {
	ID                string        `json:"id"`
	RunID             string        `json:"runId"`
	Status            ActionStatus  `json:"status"`
	Title             string        `json:"title"`
	Description       string        `json:"description"`
	ButtonLabel       string        `json:"buttonLabel"`
	Targets           []Target      `json:"targets"`
	Inputs            []SecretField `json:"inputs"`
	NeedsConfirmation bool          `json:"needsConfirmation"`
	Operation         Operation     `json:"operation"`
	Fingerprint       string        `json:"fingerprint"`
	Result            string        `json:"result"`
	HasPrivateResult  bool          `json:"hasPrivateResult"`
	CreatedAt         string        `json:"createdAt"`
	Destructive       bool          `json:"destructive"`
}

type Target struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Href string `json:"href"`
}

type SecretField struct {
	Path     string `json:"path"`
	Label    string `json:"label"`
	Optional bool   `json:"optional"`
}

type SecretValue struct {
	Path  string
	Value string
}

// Operation is a single GraphQL mutation and its JSON arguments.
type Operation struct {
	Field        string          `json:"field"`
	Arguments    json.RawMessage `json:"arguments"`
	Selection    string          `json:"selection"`
	AttachmentID string          `json:"attachmentId,omitempty"`
}

type Assessment struct {
	Title             string
	Description       string
	ButtonLabel       string
	Targets           []Target
	Inputs            []SecretField
	Fingerprint       string
	NeedsConfirmation bool
	Destructive       bool
}

// Gateway runs the same application operations used by browser clients.
type Gateway interface {
	Discover(context.Context, string) (string, error)
	Query(context.Context, string, json.RawMessage) (string, error)
	Assess(context.Context, Operation) (Assessment, error)
	Execute(context.Context, Operation, []SecretValue) (ExecutionResult, error)
}

type ExecutionResult struct {
	Public  string
	Private string
}

type Invocation struct {
	Model      string
	System     string
	Prompt     string
	Token      string
	Images     []store.AssistantAttachment
	MCPURL     string
	MCPToken   string
	JSONSchema string
	OnText     func(string)
	OnActivity func(string)
}

type Result struct {
	Text       string
	Structured json.RawMessage
	CostUSD    float64
}
type AvailableModel struct {
	ID            string
	Name          string
	ResolvedModel string
}

type Runner interface {
	Models(context.Context, string) ([]AvailableModel, error)
	Run(context.Context, Invocation) (Result, error)
}

type change struct {
	UserID         string
	ConversationID string
}

func timestamp() string { return time.Now().UTC().Format(time.RFC3339Nano) }

func principal(ctx context.Context) (auth.Principal, error) {
	p, ok := auth.PrincipalFromContext(ctx)
	if !ok || p.Guest || p.MustChangePassword {
		return p, ErrAccess
	}
	return p, nil
}
