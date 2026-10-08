package automation

import (
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// holdKey identifies one hold trigger across reloads.
type holdKey struct {
	automationID string
	nodeID       NodeID
}

// holdState tracks one hold trigger. While the condition holds and the trigger
// has not fired, a timer runs towards deadline. fired latches after the timer
// fires so the trigger fires once per stretch of the condition being true.
// manual marks a timer started by a manual fire, which simulates the condition
// holding: device reports neither cancel it nor are checked when it fires.
// generation invalidates timer callbacks that lost a race with a cancel.
type holdState struct {
	signature  string
	stop       func() bool
	deadline   time.Time
	fired      bool
	manual     bool
	generation uint64
}

func (s *holdState) cancel() bool {
	if s.stop == nil {
		return false
	}
	s.stop()
	s.stop = nil
	s.generation++
	return true
}

// holdSignature captures everything that defines what a hold trigger waits
// for, so a reload keeps the running timer of a trigger that did not change.
func holdSignature(tc TriggerConfig) string {
	return fmt.Sprintf("%s\x00%s\x00%d", tc.HoldDeviceID, tc.FilterExpr, tc.HoldMs)
}

func isHoldTrigger(ct compiledTrigger) bool {
	return ct.config.HoldMs > 0 && ct.config.HoldDeviceID != "" && ct.program != nil
}

// holdEvent synthesizes a state-changed event carrying the device's full
// current state. The trigger's filter is written against a state report, so
// evaluating it on the merged state answers "is the condition true now"
// instead of "did this partial report match".
func (e *Engine) holdEvent(ct compiledTrigger, now time.Time) eventbus.Event {
	state := device.DeviceState{}
	if current, ok := e.reader.GetDeviceState(device.DeviceID(ct.config.HoldDeviceID)); ok && current != nil {
		state = *current
	}
	return eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  ct.config.HoldDeviceID,
		Timestamp: now,
		Payload:   device.DeviceStateChange{State: state},
	}
}

func (e *Engine) holdConditionMet(ct compiledTrigger, now time.Time) (bool, ExprEnv) {
	event := e.holdEvent(ct, now)
	env := e.exprScope().env(&event, e.inLocation(now))
	result, err := evalExpr(ct.program, env)
	if err != nil {
		logger.Error("hold trigger eval error", "automation_id", ct.graphID, "node_id", ct.nodeID, "error", err)
		return false, env
	}
	return result, env
}

// updateHolds re-evaluates every hold trigger watching the device a state
// report came from.
func (e *Engine) updateHolds(event eventbus.Event) {
	if event.Type != eventbus.EventDeviceStateChanged {
		return
	}
	e.mu.RLock()
	triggers := e.triggers[string(eventbus.EventDeviceStateChanged)]
	e.mu.RUnlock()
	for _, ct := range triggers {
		if isHoldTrigger(ct) && ct.config.HoldDeviceID == event.DeviceID {
			e.evaluateHold(ct)
		}
	}
}

// evaluateHold starts the hold timer when the condition has become true and
// cancels it, re-arming the trigger, when the condition is false.
func (e *Engine) evaluateHold(ct compiledTrigger) {
	now := e.now()
	holding, _ := e.holdConditionMet(ct, now)
	key := holdKey{ct.graphID, ct.nodeID}

	e.mu.Lock()
	state := e.holds[key]
	if state == nil {
		state = &holdState{signature: holdSignature(ct.config)}
		e.holds[key] = state
	}
	if state.manual && state.stop != nil {
		e.mu.Unlock()
		return
	}
	if !holding {
		cancelled := state.cancel()
		state.fired = false
		e.mu.Unlock()
		if cancelled {
			e.publishHoldPending(ct.graphID, ct.nodeID, nil)
		}
		return
	}
	if state.fired || state.stop != nil {
		e.mu.Unlock()
		return
	}
	state.generation++
	generation := state.generation
	hold := time.Duration(ct.config.HoldMs) * time.Millisecond
	state.deadline = now.Add(hold)
	deadline := state.deadline
	state.stop = e.afterFunc(hold, func() { e.fireHold(ct, generation) })
	e.mu.Unlock()
	e.publishHoldPending(ct.graphID, ct.nodeID, &deadline)
}

// fireHold runs when a hold timer expires: the condition has been true for the
// whole hold, so the trigger fires through the same path as a scheduled one.
func (e *Engine) fireHold(ct compiledTrigger, generation uint64) {
	key := holdKey{ct.graphID, ct.nodeID}
	e.mu.Lock()
	state := e.holds[key]
	if state == nil || state.generation != generation || state.stop == nil {
		e.mu.Unlock()
		return
	}
	state.stop = nil
	manual := state.manual
	state.manual = false
	state.fired = !manual
	cg, loaded := e.graphs[ct.graphID]
	e.mu.Unlock()
	e.publishHoldPending(ct.graphID, ct.nodeID, nil)
	if !loaded {
		return
	}

	now := e.now()
	holding, env := e.holdConditionMet(ct, now)
	if !holding && !manual {
		e.mu.Lock()
		state.fired = false
		e.mu.Unlock()
		return
	}
	if e.triggerInCooldown(ct.graphID, ct.nodeID, now, ct.config.CooldownMs) {
		e.cooldownSkips.Add(1)
		return
	}
	e.recordTriggerFired(ct.graphID, ct.nodeID, now)
	triggerResults := e.combineWithGrace(cg, map[NodeID]bool{ct.nodeID: true}, now)
	if e.evaluateGraph(cg, env, triggerResults) {
		e.recordAutomationFired(ct.graphID, now)
	}
}

// startManualHold runs a hold trigger's countdown as if its condition had just
// become true, then fires it, whatever the device reports meanwhile.
func (e *Engine) startManualHold(ct compiledTrigger) {
	key := holdKey{ct.graphID, ct.nodeID}
	e.mu.Lock()
	state := e.holds[key]
	if state == nil {
		state = &holdState{signature: holdSignature(ct.config)}
		e.holds[key] = state
	}
	state.cancel()
	state.manual = true
	state.generation++
	generation := state.generation
	hold := time.Duration(ct.config.HoldMs) * time.Millisecond
	state.deadline = e.now().Add(hold)
	deadline := state.deadline
	state.stop = e.afterFunc(hold, func() { e.fireHold(ct, generation) })
	e.mu.Unlock()
	e.publishHoldPending(ct.graphID, ct.nodeID, &deadline)
}

// holdTrigger returns the loaded hold trigger for one node.
func (e *Engine) holdTrigger(automationID string, nodeID NodeID) (compiledTrigger, bool) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	for _, ct := range e.triggers[string(eventbus.EventDeviceStateChanged)] {
		if ct.graphID == automationID && ct.nodeID == nodeID && isHoldTrigger(ct) {
			return ct, true
		}
	}
	return compiledTrigger{}, false
}

// reconcileHolds keeps the timers of hold triggers that a reload left
// unchanged, cancels those of removed or changed triggers, and evaluates new
// ones against current state so a condition that is already true starts
// counting without waiting for the next report.
func (e *Engine) reconcileHolds(triggersByEvent map[string][]compiledTrigger) {
	current := make(map[holdKey]compiledTrigger)
	for _, ct := range triggersByEvent[string(eventbus.EventDeviceStateChanged)] {
		if isHoldTrigger(ct) {
			current[holdKey{ct.graphID, ct.nodeID}] = ct
		}
	}

	var cleared []holdKey
	var fresh []compiledTrigger
	e.mu.Lock()
	for key, state := range e.holds {
		ct, ok := current[key]
		if ok && state.signature == holdSignature(ct.config) {
			continue
		}
		if state.cancel() {
			cleared = append(cleared, key)
		}
		delete(e.holds, key)
	}
	for key, ct := range current {
		if _, ok := e.holds[key]; !ok {
			fresh = append(fresh, ct)
		}
	}
	e.mu.Unlock()

	for _, key := range cleared {
		e.publishHoldPending(key.automationID, key.nodeID, nil)
	}
	for _, ct := range fresh {
		e.evaluateHold(ct)
	}
}

// PendingHolds returns, for one automation, when each running hold will fire,
// keyed by trigger node.
func (e *Engine) PendingHolds(automationID string) map[NodeID]time.Time {
	e.mu.RLock()
	defer e.mu.RUnlock()
	out := make(map[NodeID]time.Time)
	for key, state := range e.holds {
		if key.automationID == automationID && state.stop != nil {
			out[key.nodeID] = state.deadline
		}
	}
	return out
}

func (e *Engine) stopHolds() {
	e.mu.Lock()
	for key, state := range e.holds {
		state.cancel()
		delete(e.holds, key)
	}
	e.mu.Unlock()
}

// publishHoldPending reports a hold timer starting (deadline set) or ending
// (nil) so the automation editor can show the trigger counting down.
func (e *Engine) publishHoldPending(automationID string, nodeID NodeID, deadline *time.Time) {
	e.bus.Publish(eventbus.Event{
		Type:      eventbus.EventAutomationNodeActivated,
		Timestamp: e.now(),
		Payload: NodeActivation{
			AutomationID: automationID,
			NodeID:       nodeID,
			PendingUntil: deadline,
		},
	})
}
