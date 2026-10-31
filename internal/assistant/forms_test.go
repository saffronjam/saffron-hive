package assistant

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func fieldPointer[T any](value T) *T { return &value }
func testChatForm() ChatForm {
	return ChatForm{ID: "scene", Title: "Design a scene", Fields: []ChatField{
		{Key: "brightness", Kind: "SLIDER", Label: "Brightness", Min: fieldPointer(0.0), Max: fieldPointer(100.0), Step: fieldPointer(1.0), Value: FieldValue{Number: fieldPointer(50.0)}},
		{Key: "name", Kind: "TEXT", Label: "Name", Value: FieldValue{Text: fieldPointer("Evening")}},
		{Key: "color", Kind: "COLOR", Label: "Colour", Value: FieldValue{Text: fieldPointer("#ffaa33")}},
		{Key: "photo", Kind: "IMAGE", Label: "Reference photo"},
		{Key: "mood", Kind: "SELECT", Label: "Mood", Options: []string{"Warm", "Cool"}, Value: FieldValue{Text: fieldPointer("Warm")}},
		{Key: "movement", Kind: "TOGGLE", Label: "Movement", Value: FieldValue{Boolean: fieldPointer(false)}},
		{Key: "pace", Kind: "NUMBER", Label: "Pace", Min: fieldPointer(1.0), Max: fieldPointer(120.0)},
	}}
}

func TestChatFieldsPersistWithoutStartingModelWork(t *testing.T) {
	s, _, ctx, p := testService(t, nil)
	id, run := seededRun(t, s, ctx, p)
	if _, err := s.defineForm(ctx, p, id, run, testChatForm()); err != nil {
		t.Fatal(err)
	}
	c, err := s.UpdateField(ctx, id, "brightness", 1, FieldValue{Number: fieldPointer(72.0)})
	if err != nil {
		t.Fatal(err)
	}
	if len(c.Runs) != 1 || len(s.workers) != 0 || *c.Forms[0].Fields[0].Value.Number != 72 {
		t.Fatalf("unexpected controls: %+v", c)
	}
	if _, err = s.UpdateField(ctx, id, "brightness", 1, FieldValue{Number: fieldPointer(10.0)}); !errors.Is(err, store.ErrRevisionConflict) {
		t.Fatalf("stale edit accepted: %v", err)
	}
	c, err = s.Get(ctx, id)
	if err != nil || *c.Forms[0].Fields[0].Value.Number != 72 {
		t.Fatal("selection did not persist", err)
	}
	other := auth.WithPrincipal(ctx, auth.Principal{ID: "other"})
	if _, err = s.UpdateField(other, id, "brightness", 2, FieldValue{Number: fieldPointer(10.0)}); err == nil {
		t.Fatal("another owner edited the form")
	}
	updated := testChatForm()
	updated.Revision = 1
	updated.Fields[0].Description = "Adjust the level"
	if _, err = s.defineForm(ctx, p, id, run, updated); err != nil {
		t.Fatal(err)
	}
	c, _ = s.Get(ctx, id)
	if *c.Forms[0].Fields[0].Value.Number != 72 {
		t.Fatal("definition overwrote the user's value")
	}
	if _, err = s.defineForm(ctx, p, id, run, updated); !errors.Is(err, store.ErrRevisionConflict) {
		t.Fatal("stale form definition accepted", err)
	}
	if err = s.deleteForm(ctx, p, id, run, "scene", 2); err != nil {
		t.Fatal(err)
	}
	c, _ = s.Get(ctx, id)
	if len(c.Forms) != 0 {
		t.Fatal("form was not removed")
	}
}

func TestChatInputsAreCapturedAtSendAndRemainStable(t *testing.T) {
	s, _, ctx, p := testService(t, nil)
	id, run := seededRun(t, s, ctx, p)
	if _, err := s.defineForm(ctx, p, id, run, testChatForm()); err != nil {
		t.Fatal(err)
	}
	if err := s.mutate(ctx, p.ID, id, func(c *Conversation) error { findRun(c, run).State = Completed; return nil }); err != nil {
		t.Fatal(err)
	}
	c, err := s.Send(ctx, id, "Use my choices", nil, uuid.NewString())
	if err != nil {
		t.Fatal(err)
	}
	message := c.Messages[len(c.Messages)-1]
	if _, err = s.UpdateField(ctx, id, "brightness", 1, FieldValue{Number: fieldPointer(91.0)}); err != nil {
		t.Fatal(err)
	}
	c, _ = s.Get(ctx, id)
	if *c.Messages[len(c.Messages)-1].Inputs[0].Value.Number != 50 {
		t.Fatal("an edit changed the submitted snapshot")
	}
	eventually(t, func() bool { c, _ = s.Get(ctx, id); return findRun(c, message.RunID).State == Running })
	raw, err := s.chatInputs(ctx, p, id, message.RunID)
	if err != nil {
		t.Fatal(err)
	}
	var values []ChatInput
	if err = json.Unmarshal([]byte(raw), &values); err != nil {
		t.Fatal(err)
	}
	if *values[0].Value.Number != 50 {
		t.Fatal("tool read a later edit")
	}
	definitions, err := s.formDefinitions(ctx, p, id, message.RunID)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(definitions, `"number":91`) {
		t.Fatal("schema tool exposed unsubmitted values")
	}
	transcriptText := transcript(c, message.RunID)
	if !strings.Contains(transcriptText, `"number":50`) || strings.Contains(transcriptText, `"number":91`) {
		t.Fatal("transcript lost the submitted input")
	}
}

func TestChatFieldValidationAndImageIsolation(t *testing.T) {
	s, st, ctx, p := testService(t, nil)
	id, run := seededRun(t, s, ctx, p)
	if _, err := s.defineForm(ctx, p, id, run, testChatForm()); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		key   string
		value FieldValue
	}{
		{"brightness", FieldValue{Number: fieldPointer(101.0)}},
		{"brightness", FieldValue{Text: fieldPointer("bad")}},
		{"brightness", FieldValue{Number: fieldPointer(2.5)}},
		{"color", FieldValue{Text: fieldPointer("javascript:alert(1)")}},
		{"mood", FieldValue{Text: fieldPointer("Unknown")}},
		{"movement", FieldValue{Text: fieldPointer("true")}},
		{"name", FieldValue{Text: fieldPointer(strings.Repeat("x", 2001))}},
		{"name", FieldValue{Text: fieldPointer("name"), Number: fieldPointer(5.0)}},
	} {
		if _, err := s.UpdateField(ctx, id, tc.key, 1, tc.value); err == nil {
			t.Fatalf("invalid %s was accepted", tc.key)
		}
	}
	second, err := s.Create(ctx)
	if err != nil {
		t.Fatal(err)
	}
	for _, cid := range []string{second.ID, id} {
		a := store.AssistantAttachment{ID: uuid.NewString(), ConversationID: cid, Name: "image.jpg", MIME: "image/jpeg", Content: []byte("image")}
		if err = st.CreateAssistantAttachment(ctx, a); err != nil {
			t.Fatal(err)
		}
		_, err = s.UpdateField(ctx, id, "photo", 1, FieldValue{AttachmentID: &a.ID})
		if cid == id && err != nil || cid != id && err == nil {
			t.Fatalf("image ownership: %v", err)
		}
	}
	duplicate := testChatForm()
	duplicate.ID = "second"
	if _, err = s.defineForm(ctx, p, id, run, duplicate); err == nil {
		t.Fatal("duplicate keys accepted")
	}
	incomplete := testChatForm()
	incomplete.Revision = 1
	incomplete.Fields[0].Step = nil
	if _, err = s.defineForm(ctx, p, id, run, incomplete); err == nil {
		t.Fatal("slider without a step accepted")
	}
	if err = s.Delete(ctx, id); err != nil {
		t.Fatal(err)
	}
	if _, err = s.Get(ctx, id); err == nil {
		t.Fatal("deleted chat retained its controls")
	}
}

func TestChatFormSectionsAndOptionalTitles(t *testing.T) {
	s, _, ctx, p := testService(t, nil)
	id, run := seededRun(t, s, ctx, p)
	form := testChatForm()
	form.Title = ""
	for i := range form.Fields {
		if i < 2 {
			form.Fields[i].Section = " Scene "
		} else {
			form.Fields[i].Section = "Light"
		}
	}
	if _, err := s.defineForm(ctx, p, id, run, form); err != nil {
		t.Fatal(err)
	}
	c, err := s.Get(ctx, id)
	if err != nil {
		t.Fatal(err)
	}
	if c.Forms[0].Title != "" || c.Forms[0].Fields[0].Section != "Scene" {
		t.Fatal("form metadata was not retained")
	}
	update := testChatForm()
	update.Title = "Bedroom · evening"
	update.Revision = 1
	for i := range update.Fields {
		update.Fields[i].Section = "Light"
	}
	update.Fields[1].Section = "Movement"
	if _, err = s.defineForm(ctx, p, id, run, update); err == nil {
		t.Fatal("accepted interleaved sections")
	}
	for i := range update.Fields {
		update.Fields[i].Section = "Light"
	}
	update.Fields[0].Section = strings.Repeat("x", 81)
	if _, err = s.defineForm(ctx, p, id, run, update); err == nil {
		t.Fatal("accepted an oversized section label")
	}
}
