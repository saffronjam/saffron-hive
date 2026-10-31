package assistant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"regexp"
	"slices"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type FieldValue struct {
	Text         *string  `json:"text,omitempty"`
	Number       *float64 `json:"number,omitempty"`
	Boolean      *bool    `json:"boolean,omitempty"`
	AttachmentID *string  `json:"attachmentId,omitempty"`
}

type ChatField struct {
	Key         string     `json:"key"`
	Kind        string     `json:"kind" jsonschema:"Control kind: SLIDER, TEXT, NUMBER, COLOR, IMAGE, SELECT or TOGGLE"`
	Label       string     `json:"label"`
	Section     string     `json:"section,omitempty" jsonschema:"Optional short heading for a group of related controls. Keep each section's fields together. Omit for small forms."`
	Description string     `json:"description,omitempty"`
	Min         *float64   `json:"min,omitempty"`
	Max         *float64   `json:"max,omitempty"`
	Step        *float64   `json:"step,omitempty"`
	Options     []string   `json:"options,omitempty"`
	Value       FieldValue `json:"value" jsonschema:"Initial value for a new field. Existing user values are preserved."`
	Revision    int64      `json:"revision,omitempty"`
}

type ChatForm struct {
	ID          string      `json:"id"`
	RunID       string      `json:"runId"`
	Title       string      `json:"title"`
	Description string      `json:"description,omitempty"`
	Revision    int64       `json:"revision,omitempty"`
	Fields      []ChatField `json:"fields"`
}

type ChatInput struct {
	Key   string     `json:"key"`
	Kind  string     `json:"kind"`
	Label string     `json:"label"`
	Value FieldValue `json:"value"`
}

var chatKey = regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$`)
var chatColor = regexp.MustCompile(`^#[a-fA-F0-9]{6}$`)

func validateField(f ChatField) error {
	if !chatKey.MatchString(f.Key) || strings.TrimSpace(f.Label) == "" || len([]rune(f.Label)) > 120 || len([]rune(f.Section)) > 80 || len([]rune(f.Description)) > 1000 {
		return errors.New("a control needs a valid key, label and description")
	}
	switch f.Kind {
	case "SLIDER", "NUMBER":
		for _, v := range []*float64{f.Min, f.Max, f.Step} {
			if v != nil && (math.IsNaN(*v) || math.IsInf(*v, 0)) {
				return errors.New("numeric limits must be finite")
			}
		}
		if f.Min != nil && f.Max != nil && *f.Min >= *f.Max || f.Step != nil && *f.Step <= 0 {
			return errors.New("numeric limits or step are invalid")
		}
		if f.Kind == "SLIDER" && (f.Min == nil || f.Max == nil || f.Step == nil) {
			return errors.New("a slider requires min, max and step")
		}
	case "SELECT":
		if len(f.Options) == 0 || len(f.Options) > 30 {
			return errors.New("a select needs 1–30 options")
		}
		seen := map[string]bool{}
		for _, option := range f.Options {
			if strings.TrimSpace(option) == "" || len([]rune(option)) > 120 || seen[option] {
				return errors.New("select options must be distinct short labels")
			}
			seen[option] = true
		}
	case "TEXT", "COLOR", "IMAGE", "TOGGLE":
	default:
		return errors.New("unsupported control kind")
	}
	return nil
}

func validateValue(f ChatField, v FieldValue) error {
	count := 0
	for _, set := range []bool{v.Text != nil, v.Number != nil, v.Boolean != nil, v.AttachmentID != nil} {
		if set {
			count++
		}
	}
	if count == 0 {
		return nil
	}
	if count != 1 {
		return errors.New("provide one typed value")
	}
	switch f.Kind {
	case "TEXT":
		if v.Text != nil && len([]rune(*v.Text)) <= 2000 {
			return nil
		}
	case "COLOR":
		if v.Text != nil && chatColor.MatchString(*v.Text) {
			return nil
		}
	case "SELECT":
		if v.Text != nil && slices.Contains(f.Options, *v.Text) {
			return nil
		}
	case "IMAGE":
		if v.AttachmentID != nil && *v.AttachmentID != "" {
			return nil
		}
	case "TOGGLE":
		if v.Boolean != nil {
			return nil
		}
	case "NUMBER", "SLIDER":
		if v.Number != nil && !math.IsNaN(*v.Number) && !math.IsInf(*v.Number, 0) && (f.Min == nil || *v.Number >= *f.Min) && (f.Max == nil || *v.Number <= *f.Max) {
			if f.Step == nil {
				return nil
			}
			origin := 0.0
			if f.Min != nil {
				origin = *f.Min
			}
			ticks := (*v.Number - origin) / *f.Step
			if math.Abs(ticks-math.Round(ticks)) < 1e-7*math.Max(1, math.Abs(ticks)) {
				return nil
			}
		}
	}
	return fmt.Errorf("invalid value for %s", f.Label)
}

func inputSnapshot(c *Conversation) []ChatInput {
	out := []ChatInput{}
	for _, form := range c.Forms {
		for _, field := range form.Fields {
			out = append(out, ChatInput{field.Key, field.Kind, field.Label, field.Value})
		}
	}
	return out
}

func (s *Service) validateInputImage(ctx context.Context, userID, conversationID string, v FieldValue) error {
	if v.AttachmentID == nil {
		return nil
	}
	a, err := s.store.GetAssistantAttachment(ctx, *v.AttachmentID, userID)
	if err != nil || a.ConversationID != conversationID {
		return errors.New("attachment is unavailable")
	}
	return nil
}

func (s *Service) defineForm(ctx context.Context, p auth.Principal, conversationID, runID string, form ChatForm) (string, error) {
	if _, err := s.toolAccess(ctx, p, conversationID, runID, true); err != nil {
		return "", err
	}
	if !chatKey.MatchString(form.ID) || len([]rune(form.Title)) > 120 || len([]rune(form.Description)) > 1000 || len(form.Fields) == 0 || len(form.Fields) > 24 {
		return "", errors.New("a form needs a valid id, an optional short title and 1–24 fields")
	}
	form.Title = strings.TrimSpace(form.Title)
	var saved ChatForm
	err := s.mutate(ctx, p.ID, conversationID, func(c *Conversation) error {
		if run := findRun(c, runID); run == nil || run.State != Running {
			return ErrWaiting
		}
		index := slices.IndexFunc(c.Forms, func(f ChatForm) bool { return f.ID == form.ID })
		old := ChatForm{}
		if index >= 0 {
			old = c.Forms[index]
		}
		if old.Revision != form.Revision {
			return store.ErrRevisionConflict
		}
		keys := map[string]bool{}
		total := 0
		for _, other := range c.Forms {
			if other.ID != form.ID {
				for _, field := range other.Fields {
					keys[field.Key] = true
					total++
				}
			}
		}
		if index < 0 && len(c.Forms) >= 12 || total+len(form.Fields) > 96 {
			return errors.New("this chat has too many controls")
		}
		closedSections := map[string]bool{}
		previousSection := ""
		for i := range form.Fields {
			field := &form.Fields[i]
			field.Section = strings.TrimSpace(field.Section)
			if field.Section != previousSection {
				if field.Section != "" && closedSections[field.Section] {
					return errors.New("keep fields in the same section together")
				}
				if previousSection != "" {
					closedSections[previousSection] = true
				}
				previousSection = field.Section
			}
			if keys[field.Key] {
				return errors.New("control keys must be unique in the chat")
			}
			keys[field.Key] = true
			if err := validateField(*field); err != nil {
				return err
			}
			field.Revision = 1
			for _, prior := range old.Fields {
				if prior.Key == field.Key {
					if prior.Kind != field.Kind {
						return errors.New("use a different key when changing a control kind")
					}
					field.Value = prior.Value
					field.Revision = prior.Revision + 1
				}
			}
			if field.Value == (FieldValue{}) {
				if field.Kind == "COLOR" {
					value := "#ffffff"
					field.Value.Text = &value
				}
				if field.Kind == "TOGGLE" {
					value := false
					field.Value.Boolean = &value
				}
			}
			if field.Kind == "SLIDER" && field.Value.Number == nil {
				field.Value.Number = field.Min
			}
			if err := validateValue(*field, field.Value); err != nil {
				return err
			}
			if err := s.validateInputImage(ctx, p.ID, conversationID, field.Value); err != nil {
				return err
			}
		}
		form.Revision = old.Revision + 1
		form.RunID = runID
		if index >= 0 {
			form.RunID = old.RunID
			c.Forms[index] = form
		} else {
			c.Forms = append(c.Forms, form)
		}
		saved = form
		return nil
	})
	if err != nil {
		return "", err
	}
	b, err := json.Marshal(formSchemas([]ChatForm{saved})[0])
	return string(b), err
}

// UpdateField saves a user selection without invoking the assistant.
func (s *Service) UpdateField(ctx context.Context, conversationID, key string, revision int64, value FieldValue) (*Conversation, error) {
	p, err := principal(ctx)
	if err != nil {
		return nil, err
	}
	if err = s.check(ctx, p); err != nil {
		return nil, err
	}
	if err = s.validateInputImage(ctx, p.ID, conversationID, value); err != nil {
		return nil, err
	}
	err = s.mutate(ctx, p.ID, conversationID, func(c *Conversation) error {
		for i := range c.Forms {
			for j := range c.Forms[i].Fields {
				field := &c.Forms[i].Fields[j]
				if field.Key != key {
					continue
				}
				if field.Revision != revision {
					return store.ErrRevisionConflict
				}
				if err := validateValue(*field, value); err != nil {
					return err
				}
				field.Value = value
				field.Revision++
				return nil
			}
		}
		return errors.New("control is unavailable")
	})
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, conversationID)
}

func (s *Service) chatInputs(ctx context.Context, p auth.Principal, conversationID, runID string) (string, error) {
	c, err := s.toolAccess(ctx, p, conversationID, runID, false)
	if err != nil {
		return "", err
	}
	for _, message := range c.Messages {
		if message.RunID == runID && message.Role == "user" {
			b, err := json.Marshal(message.Inputs)
			return string(b), err
		}
	}
	return "[]", nil
}

func (s *Service) formDefinitions(ctx context.Context, p auth.Principal, conversationID, runID string) (string, error) {
	c, err := s.toolAccess(ctx, p, conversationID, runID, false)
	if err != nil {
		return "", err
	}
	b, err := json.Marshal(formSchemas(c.Forms))
	return string(b), err
}

func (s *Service) deleteForm(ctx context.Context, p auth.Principal, conversationID, runID, id string, revision int64) error {
	if _, err := s.toolAccess(ctx, p, conversationID, runID, true); err != nil {
		return err
	}
	return s.mutate(ctx, p.ID, conversationID, func(c *Conversation) error {
		if run := findRun(c, runID); run == nil || run.State != Running {
			return ErrWaiting
		}
		index := slices.IndexFunc(c.Forms, func(f ChatForm) bool { return f.ID == id })
		if index < 0 {
			return errors.New("form is unavailable")
		}
		if c.Forms[index].Revision != revision {
			return store.ErrRevisionConflict
		}
		c.Forms = slices.Delete(c.Forms, index, index+1)
		return nil
	})
}

func formSchemas(forms []ChatForm) []ChatForm {
	out := make([]ChatForm, 0, len(forms))
	for _, form := range forms {
		form.Fields = slices.Clone(form.Fields)
		for i := range form.Fields {
			form.Fields[i].Value = FieldValue{}
			form.Fields[i].Revision = 0
		}
		out = append(out, form)
	}
	return out
}
