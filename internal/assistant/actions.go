package assistant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/auth"
)

func (s *Service) toolAccess(ctx context.Context, p auth.Principal, conversationID, runID string, write bool) (*Conversation, error) {
	if err := s.check(ctx, p); err != nil {
		return nil, err
	}
	if _, err := s.enabled(ctx); err != nil {
		return nil, err
	}
	c, err := s.load(ctx, conversationID, p.ID)
	if err != nil {
		return nil, err
	}
	r := findRun(c, runID)
	if r == nil || r.TokenVersion != p.TokenVersion {
		return nil, ErrAccess
	}
	if r.State != Running && !(r.State == Waiting && !write) {
		return nil, ErrWaiting
	}
	return c, nil
}

func (s *Service) act(ctx context.Context, p auth.Principal, conversationID, runID string, op Operation, force bool) (string, error) {
	c, err := s.toolAccess(ctx, p, conversationID, runID, true)
	if err != nil {
		return "", err
	}
	if op.AttachmentID != "" {
		a, err := s.store.GetAssistantAttachment(ctx, op.AttachmentID, p.ID)
		if err != nil || a.ConversationID != conversationID {
			return "", ErrAccess
		}
	}
	assessment, err := s.gateway.Assess(ctx, op)
	if err != nil {
		return "", err
	}
	r := findRun(c, runID)
	if assessment.Destructive && (r.BulkIntent || len(r.DestructiveIDs) > 0) {
		assessment.NeedsConfirmation = true
	}
	assessment.NeedsConfirmation = assessment.NeedsConfirmation || force
	for _, a := range c.Actions {
		if a.RunID == runID && a.Operation.Field == op.Field && string(a.Operation.Arguments) == string(op.Arguments) && a.Status == Done {
			return actionResponse(a), nil
		}
	}
	action := Action{ID: uuid.NewString(), RunID: runID, Status: Executing, Title: assessment.Title, Description: assessment.Description, ButtonLabel: assessment.ButtonLabel, Targets: assessment.Targets, Inputs: assessment.Inputs, NeedsConfirmation: assessment.NeedsConfirmation, Operation: op, Fingerprint: assessment.Fingerprint, CreatedAt: timestamp(), Destructive: assessment.Destructive}
	if assessment.NeedsConfirmation {
		action.Status = Pending
	}
	if len(action.Inputs) > 0 {
		action.Status = NeedsInput
	}
	err = s.mutate(ctx, p.ID, conversationID, func(c *Conversation) error {
		r := findRun(c, runID)
		if r == nil || r.State != Running {
			return ErrWaiting
		}
		c.Actions = append(c.Actions, action)
		if action.Status != Executing {
			r.State = Waiting
			r.Activity = "waiting"
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	if action.Status != Executing {
		return actionResponse(action), nil
	}
	s.activity(ctx, p, conversationID, runID, op.Field)
	result, execErr := s.gateway.Execute(ctx, op, nil)
	err = s.recordAction(context.WithoutCancel(ctx), p, conversationID, action.ID, result, execErr)
	if err != nil {
		return "", err
	}
	if execErr != nil {
		return "", execErr
	}
	return result.Public, nil
}

func actionResponse(a Action) string {
	b, _ := json.Marshal(struct {
		ID     string       `json:"id"`
		Status ActionStatus `json:"status"`
		Title  string       `json:"title"`
		Result string       `json:"result"`
	}{a.ID, a.Status, a.Title, a.Result})
	return string(b)
}

func (s *Service) recordAction(ctx context.Context, p auth.Principal, id, actionID string, result ExecutionResult, execErr error) error {
	return s.mutate(ctx, p.ID, id, func(c *Conversation) error {
		a := findAction(c, actionID)
		if a == nil {
			return errors.New("action is unavailable")
		}
		a.Result = result.Public
		a.HasPrivateResult = result.Private != ""
		if result.Private != "" {
			s.privateResults[actionID] = privateResult{Value: result.Private, Expires: time.Now().Add(10 * time.Minute)}
		}
		a.Status = Done
		if execErr != nil {
			a.Status = ActionFailed
			a.Result = execErr.Error()
		}
		if a.Destructive && execErr == nil {
			r := findRun(c, a.RunID)
			for _, t := range a.Targets {
				if !slices.Contains(r.DestructiveIDs, t.ID) {
					r.DestructiveIDs = append(r.DestructiveIDs, t.ID)
				}
			}
		}
		return nil
	})
}

// Respond accepts a browser decision and executes only the stored operation.
func (s *Service) Respond(ctx context.Context, id, actionID string, approve, acknowledged bool, values []SecretValue) (*Conversation, error) {
	p, err := principal(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.check(ctx, p); err != nil {
		return nil, err
	}
	if _, err := s.enabled(ctx); err != nil {
		return nil, err
	}
	c, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	a := findAction(c, actionID)
	if a == nil {
		return nil, errors.New("action is unavailable")
	}
	if a.Status != Pending && a.Status != NeedsInput {
		return c, nil
	}
	r := findRun(c, a.RunID)
	if r == nil || r.TokenVersion != p.TokenVersion {
		return nil, ErrAccess
	}
	if approve && a.NeedsConfirmation && !acknowledged {
		return nil, errors.New("acknowledge the consequences before confirming")
	}
	if approve {
		if len(values) != len(a.Inputs) {
			return nil, errors.New("complete every private field")
		}
		seen := map[string]bool{}
		for _, f := range a.Inputs {
			found := false
			for _, v := range values {
				if v.Path == f.Path && (v.Value != "" || f.Optional) && !seen[v.Path] {
					found = true
					seen[v.Path] = true
					break
				}
			}
			if !found {
				return nil, fmt.Errorf("complete %s", f.Label)
			}
		}
		current, err := s.gateway.Assess(ctx, a.Operation)
		if err != nil {
			return nil, err
		}
		if current.Fingerprint != a.Fingerprint {
			err = s.mutate(ctx, p.ID, id, func(c *Conversation) error {
				findAction(c, actionID).Status = Stale
				r := findRun(c, a.RunID)
				r.State = Queued
				return nil
			})
			if err != nil {
				return nil, err
			}
			s.resume(p, id)
			return s.Get(ctx, id)
		}
	}
	claimed := false
	err = s.mutate(ctx, p.ID, id, func(c *Conversation) error {
		action := findAction(c, actionID)
		if action == nil || action.Status != Pending && action.Status != NeedsInput {
			return nil
		}
		r := findRun(c, action.RunID)
		if r.State != Waiting {
			return ErrWaiting
		}
		claimed = true
		if approve {
			action.Status = Executing
		} else {
			action.Status = Rejected
			action.Result = "The user rejected this action."
			r.State = Queued
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if !claimed {
		return s.Get(ctx, id)
	}
	if approve {
		result, execErr := s.gateway.Execute(ctx, a.Operation, values)
		if err := s.recordAction(context.WithoutCancel(ctx), p, id, actionID, result, execErr); err != nil {
			return nil, err
		}
		_ = s.mutate(context.WithoutCancel(ctx), p.ID, id, func(c *Conversation) error {
			r := findRun(c, a.RunID)
			if r.State == Waiting {
				r.State = Queued
			}
			return nil
		})
	}
	s.resume(p, id)
	return s.Get(ctx, id)
}

func (s *Service) resume(p auth.Principal, id string) {
	s.mu.Lock()
	if w := s.workers[id]; w != nil {
		w.cancel()
		s.mu.Unlock()
		return
	}
	s.mu.Unlock()
	s.kick(p, id)
}

type privateResult struct {
	Value   string
	Expires time.Time
}

// PrivateResult reveals short-lived output only through the authenticated browser API.
func (s *Service) PrivateResult(ctx context.Context, id, actionID string) (string, error) {
	c, err := s.Get(ctx, id)
	if err != nil {
		return "", err
	}
	a := findAction(c, actionID)
	if a == nil || !a.HasPrivateResult {
		return "", errors.New("private result is unavailable")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for id, v := range s.privateResults {
		if time.Now().After(v.Expires) {
			delete(s.privateResults, id)
		}
	}
	v, ok := s.privateResults[actionID]
	if !ok {
		return "", errors.New("private result has expired; manage the credential on its settings page")
	}
	return v.Value, nil
}
