package graph

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"mime/multipart"
	"net/http"
	"net/http/httptest"

	"github.com/saffronjam/saffron-hive/internal/assistant"
	"github.com/saffronjam/saffron-hive/internal/auth"
)

func (g *AssistantGateway) assessAvatar(ctx context.Context, op assistant.Operation) (assistant.Assessment, error) {
	p, ok := auth.PrincipalFromContext(ctx)
	if !ok || p.Guest {
		return assistant.Assessment{}, assistant.ErrAccess
	}
	if op.Field == "setAvatar" {
		if _, err := g.attachments.GetAssistantAttachment(ctx, op.AttachmentID, p.ID); err != nil {
			return assistant.Assessment{}, err
		}
	}
	snapshot, err := g.Query(ctx, `query { me { id avatarPath } }`, nil)
	if err != nil {
		return assistant.Assessment{}, err
	}
	sum := sha256.Sum256([]byte(snapshot + op.Field + op.AttachmentID))
	return assistant.Assessment{Title: operationLabel(op.Field), ButtonLabel: operationLabel(op.Field), Description: "Update your profile picture.", Targets: []assistant.Target{{ID: p.ID, Name: "Your profile", Href: "/profile"}}, Fingerprint: hex.EncodeToString(sum[:])}, nil
}
func (g *AssistantGateway) executeAvatar(ctx context.Context, op assistant.Operation) (string, error) {
	p, ok := auth.PrincipalFromContext(ctx)
	if !ok || p.Guest {
		return "", assistant.ErrAccess
	}
	var body bytes.Buffer
	method := http.MethodDelete
	contentType := ""
	if op.Field == "setAvatar" {
		a, err := g.attachments.GetAssistantAttachment(ctx, op.AttachmentID, p.ID)
		if err != nil {
			return "", err
		}
		w := multipart.NewWriter(&body)
		part, err := w.CreateFormFile("file", "avatar.jpg")
		if err != nil {
			return "", err
		}
		if _, err = part.Write(a.Content); err != nil {
			return "", err
		}
		if err = w.Close(); err != nil {
			return "", err
		}
		contentType = w.FormDataContentType()
		method = http.MethodPost
	}
	req, err := http.NewRequestWithContext(ctx, method, "http://hive.internal/api/avatars", &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", contentType)
	rec := httptest.NewRecorder()
	g.avatar.ServeHTTP(rec, req)
	if rec.Code < 200 || rec.Code >= 300 {
		return "", errors.New("could not update avatar")
	}
	g.resolver.ApplicationRevision.Add(1)
	return `{"updated":true}`, nil
}
