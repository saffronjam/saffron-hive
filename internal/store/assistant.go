package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

type ClaudeConfig struct {
	Revision int64
	Token    string
	Enabled  bool
	Model    string
}

type AssistantConversation struct {
	ID            string
	UserID        string
	AutoTitle     string
	TitleOverride string
	Document      string
	Revision      int64
	UpdatedAt     string
}

type AssistantAttachment struct {
	ID             string
	ConversationID string
	Name           string
	MIME           string
	Content        []byte
	CreatedAt      string
}

func (s *DB) GetClaudeConfig(ctx context.Context) (*ClaudeConfig, error) {
	r, err := s.q.GetClaudeConfig(ctx)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &ClaudeConfig{Revision: r.Revision, Token: r.Token, Enabled: r.Enabled != 0, Model: r.Model}, nil
}

func (s *DB) SaveClaudeConfig(ctx context.Context, c ClaudeConfig) error {
	var enabled int64
	if c.Enabled {
		enabled = 1
	}
	n, err := s.q.SaveClaudeConfig(ctx, sqlite.SaveClaudeConfigParams{ExpectedRevision: c.Revision, Token: c.Token, Enabled: enabled, Model: c.Model})
	if err != nil {
		return err
	}
	if n != 1 {
		return ErrRevisionConflict
	}
	return nil
}

func (s *DB) DeleteClaudeConfig(ctx context.Context) error { return s.q.DeleteClaudeConfig(ctx) }

func (s *DB) ListAssistantConversations(ctx context.Context, userID string) ([]AssistantConversation, error) {
	rows, err := s.q.ListAssistantConversations(ctx, userID)
	out := make([]AssistantConversation, 0, len(rows))
	for _, r := range rows {
		out = append(out, AssistantConversation{ID: r.ID, UserID: r.UserID, AutoTitle: r.AutoTitle, TitleOverride: r.TitleOverride, Revision: r.Revision, UpdatedAt: r.UpdatedAt})
	}
	return out, err
}

func (s *DB) GetAssistantConversation(ctx context.Context, id, userID string) (AssistantConversation, error) {
	r, err := s.q.GetAssistantConversation(ctx, sqlite.GetAssistantConversationParams{ID: id, UserID: userID})
	return AssistantConversation{ID: r.ID, UserID: r.UserID, AutoTitle: r.AutoTitle, TitleOverride: r.TitleOverride, Document: r.Document, Revision: r.Revision, UpdatedAt: r.UpdatedAt}, err
}

func (s *DB) CreateAssistantConversation(ctx context.Context, c AssistantConversation) error {
	return s.q.CreateAssistantConversation(ctx, sqlite.CreateAssistantConversationParams{ID: c.ID, UserID: c.UserID, AutoTitle: c.AutoTitle, TitleOverride: c.TitleOverride, Document: c.Document, UpdatedAt: time.Now().UTC().Format(time.RFC3339Nano)})
}

func (s *DB) SaveAssistantConversation(ctx context.Context, c AssistantConversation) error {
	n, err := s.q.SaveAssistantConversation(ctx, sqlite.SaveAssistantConversationParams{ID: c.ID, UserID: c.UserID, AutoTitle: c.AutoTitle, TitleOverride: c.TitleOverride, Document: c.Document, Revision: c.Revision, UpdatedAt: time.Now().UTC().Format(time.RFC3339Nano)})
	if err != nil {
		return err
	}
	if n != 1 {
		return fmt.Errorf("conversation changed or is unavailable")
	}
	return nil
}

func (s *DB) DeleteAssistantConversation(ctx context.Context, id, userID string) error {
	return s.q.DeleteAssistantConversation(ctx, sqlite.DeleteAssistantConversationParams{ID: id, UserID: userID})
}

func (s *DB) ListAssistantConversationOwners(ctx context.Context) ([]AssistantConversation, error) {
	rows, err := s.q.ListAssistantConversationOwners(ctx)
	out := make([]AssistantConversation, 0, len(rows))
	for _, r := range rows {
		out = append(out, AssistantConversation{ID: r.ID, UserID: r.UserID})
	}
	return out, err
}

func (s *DB) CreateAssistantAttachment(ctx context.Context, a AssistantAttachment) error {
	return s.q.CreateAssistantAttachment(ctx, sqlite.CreateAssistantAttachmentParams{ID: a.ID, ConversationID: a.ConversationID, Name: a.Name, Mime: a.MIME, Content: a.Content, CreatedAt: time.Now().UTC().Format(time.RFC3339Nano)})
}

func (s *DB) GetAssistantAttachment(ctx context.Context, id, userID string) (AssistantAttachment, error) {
	r, err := s.q.GetAssistantAttachment(ctx, sqlite.GetAssistantAttachmentParams{ID: id, UserID: userID})
	return AssistantAttachment{ID: r.ID, ConversationID: r.ConversationID, Name: r.Name, MIME: r.Mime, Content: r.Content, CreatedAt: r.CreatedAt}, err
}

func (s *DB) DeleteAssistantAttachment(ctx context.Context, id, userID string) error {
	return s.q.DeleteAssistantAttachment(ctx, sqlite.DeleteAssistantAttachmentParams{ID: id, UserID: userID})
}
