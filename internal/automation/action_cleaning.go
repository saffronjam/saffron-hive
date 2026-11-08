package automation

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
)

type cleaningActionPayload struct {
	RoomIDs []string         `json:"roomIds,omitempty"`
	Options cleaning.Options `json:"options,omitempty"`
	Action  string           `json:"action,omitempty"`
}

type cleaningActionJob struct {
	ctx    context.Context
	config ActionConfig
}

const cleaningActionQueueLimit = 256

func (a *ActionExecutor) queueCleaning(ctx context.Context, config ActionConfig) error {
	if err := validateCleaningAction(config); err != nil {
		return err
	}
	a.cleaningMu.Lock()
	defer a.cleaningMu.Unlock()
	if len(a.cleaningQueue) >= cleaningActionQueueLimit {
		return errors.New("cleaning action queue is full")
	}
	a.cleaningQueue = append(a.cleaningQueue, cleaningActionJob{ctx, config})
	if !a.cleaningRunning {
		a.cleaningRunning = true
		go a.runCleaningActions()
	}
	return nil
}

func (a *ActionExecutor) runCleaningActions() {
	for {
		a.cleaningMu.Lock()
		if len(a.cleaningQueue) == 0 {
			a.cleaningRunning = false
			a.cleaningMu.Unlock()
			return
		}
		job := a.cleaningQueue[0]
		a.cleaningQueue[0] = cleaningActionJob{}
		a.cleaningQueue = a.cleaningQueue[1:]
		a.cleaningMu.Unlock()
		if job.ctx.Err() != nil {
			continue
		}
		if err := a.executeCleaning(job.ctx, job.config); err != nil {
			logger.Warn("cleaning action failed", "automation_id", job.config.AutomationID, "node_id", job.config.NodeID, "error", err)
		}
	}
}

func validateCleaningAction(c ActionConfig) error {
	if c.TargetType != TargetDevice || c.TargetID == "" {
		return errors.New("cleaning requires a vacuum target")
	}
	var p cleaningActionPayload
	if err := decodeNodeConfig(c.Payload, &p); err != nil {
		return err
	}
	if c.ActionType == ActionStartCleaning {
		if p.Action != "" || len(p.RoomIDs) == 0 {
			return errors.New("start_cleaning requires Hive room IDs")
		}
		for _, id := range p.RoomIDs {
			if strings.TrimSpace(id) == "" {
				return errors.New("empty cleaning room ID")
			}
		}
		return p.Options.Validate()
	}
	if len(p.RoomIDs) > 0 || p.Options.Suction != nil || p.Options.Water != nil || p.Options.Repeats != 0 {
		return errors.New("control_cleaning accepts an action only")
	}
	switch p.Action {
	case "pause", "resume", "stop", "dock", "locate", "empty_bin":
		return nil
	}
	return errors.New("unsupported cleaning action")
}
func (a *ActionExecutor) executeCleaning(ctx context.Context, c ActionConfig) error {
	if a.cleaner == nil {
		return errors.New("cleaning is unavailable")
	}
	if err := validateCleaningAction(c); err != nil {
		return err
	}
	var p cleaningActionPayload
	if err := decodeNodeConfig(c.Payload, &p); err != nil {
		return err
	}
	if c.ActionType == ActionControlCleaning {
		return a.cleaner.Control(ctx, c.TargetID, p.Action, "automation")
	}
	snapshot, err := a.cleaner.Snapshot(ctx, c.TargetID)
	if err != nil {
		return err
	}
	plan, err := a.cleaner.Prepare(ctx, c.TargetID, strconv.Itoa(snapshot.ActiveMapID), p.RoomIDs, p.Options, cleaning.ScopeRooms)
	if err != nil {
		return err
	}
	if _, err = a.cleaner.Start(ctx, plan, uuid.NewString(), "", "automation"); err != nil {
		return fmt.Errorf("start cleaning: %w", err)
	}
	return nil
}
