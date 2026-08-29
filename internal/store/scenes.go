package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateScene atomically inserts a Scene and its complete definition.
func (s *DB) CreateScene(ctx context.Context, params CreateSceneParams) (Scene, error) {
	if params.ID == "" || params.Name == "" {
		return Scene{}, errors.New("scene ID and name are required")
	}
	if err := ValidateSceneDefinition(params.Definition); err != nil {
		return Scene{}, err
	}
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.CreateScene(ctx, sqlite.CreateSceneParams{
			ID: params.ID, Name: params.Name, CreatedBy: params.CreatedBy,
		}); err != nil {
			return fmt.Errorf("create scene: %w", err)
		}
		return replaceSceneDefinition(ctx, q, params.ID, params.Definition)
	})
	if err != nil {
		return Scene{}, err
	}
	return s.GetScene(ctx, params.ID)
}

// GetScene retrieves Scene metadata and its complete typed definition.
func (s *DB) GetScene(ctx context.Context, id string) (Scene, error) {
	row, err := s.q.GetScene(ctx, id)
	if err != nil {
		return Scene{}, fmt.Errorf("get scene: %w", err)
	}
	definition, err := loadSceneDefinition(ctx, s.q, id)
	if err != nil {
		return Scene{}, fmt.Errorf("get scene definition: %w", err)
	}
	return Scene{
		ID:          row.ID,
		Name:        row.Name,
		Icon:        row.Icon,
		CreatedAt:   row.CreatedAt,
		UpdatedAt:   row.UpdatedAt,
		ActivatedAt: row.ActivatedAt,
		CreatedBy:   userRefFromPtrs(row.CreatorID, row.CreatorUsername, row.CreatorName),
		Definition:  definition,
	}, nil
}

// ListScenes returns every Scene with its complete typed definition.
func (s *DB) ListScenes(ctx context.Context) ([]Scene, error) {
	rows, err := s.q.ListScenes(ctx)
	if err != nil {
		return nil, fmt.Errorf("list scenes: %w", err)
	}
	scenes := make([]Scene, 0, len(rows))
	for _, row := range rows {
		definition, err := loadSceneDefinition(ctx, s.q, row.ID)
		if err != nil {
			return nil, fmt.Errorf("load scene %q definition: %w", row.ID, err)
		}
		scenes = append(scenes, Scene{
			ID:          row.ID,
			Name:        row.Name,
			Icon:        row.Icon,
			CreatedAt:   row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
			ActivatedAt: row.ActivatedAt,
			CreatedBy:   userRefFromPtrs(row.CreatorID, row.CreatorUsername, row.CreatorName),
			Definition:  definition,
		})
	}
	return scenes, nil
}

// UpdateScene atomically updates metadata and, when supplied, the complete
// definition.
func (s *DB) UpdateScene(ctx context.Context, id string, params UpdateSceneParams) (Scene, error) {
	if params.Definition != nil {
		if err := ValidateSceneDefinition(*params.Definition); err != nil {
			return Scene{}, err
		}
	}
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		if params.Name != nil {
			if *params.Name == "" {
				return errors.New("scene name is required")
			}
			if err := q.UpdateSceneName(ctx, sqlite.UpdateSceneNameParams{Name: *params.Name, ID: id}); err != nil {
				return fmt.Errorf("update scene name: %w", err)
			}
		}
		if params.SetIcon {
			if params.Icon == nil {
				if err := q.ClearSceneIcon(ctx, id); err != nil {
					return fmt.Errorf("clear scene icon: %w", err)
				}
			} else if err := q.UpdateSceneIcon(ctx, sqlite.UpdateSceneIconParams{Icon: params.Icon, ID: id}); err != nil {
				return fmt.Errorf("update scene icon: %w", err)
			}
		}
		if params.Definition != nil {
			if err := replaceSceneDefinition(ctx, q, id, *params.Definition); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return Scene{}, err
	}
	return s.GetScene(ctx, id)
}

// SaveSceneDefinition atomically replaces the complete content definition.
func (s *DB) SaveSceneDefinition(ctx context.Context, sceneID string, definition SceneDefinition) error {
	if err := ValidateSceneDefinition(definition); err != nil {
		return err
	}
	return s.execTx(ctx, func(q *sqlite.Queries) error { return replaceSceneDefinition(ctx, q, sceneID, definition) })
}

// DeleteScene deletes a Scene and every composition row through cascades.
func (s *DB) DeleteScene(ctx context.Context, id string) error {
	if err := s.q.DeleteScene(ctx, id); err != nil {
		return fmt.Errorf("delete scene: %w", err)
	}
	return nil
}

// BatchDeleteScenes deletes matching Scenes and returns the affected count.
func (s *DB) BatchDeleteScenes(ctx context.Context, ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	encoded, err := marshalStringArray(ids)
	if err != nil {
		return 0, fmt.Errorf("batch delete scenes: %w", err)
	}
	count, err := s.q.BatchDeleteScenes(ctx, encoded)
	if err != nil {
		return 0, fmt.Errorf("batch delete scenes: %w", err)
	}
	return count, nil
}

// ValidateSceneDefinition enforces the typed composition invariants before a
// transaction starts.
func ValidateSceneDefinition(definition SceneDefinition) error {
	if len(definition.Targets) == 0 && len(definition.Supporting) == 0 {
		return errors.New("Scene requires a lighting target or supporting state")
	}
	if dynamic := definition.Lighting.Dynamic; dynamic != nil {
		if err := dynamic.Field.Validate(); err != nil {
			return fmt.Errorf("dynamic field: %w", err)
		}
		if !finiteBounded(dynamic.Brightness) || !finiteBounded(dynamic.Movement) || dynamic.Cycle <= 0 {
			return errors.New("dynamic brightness, movement, or cycle is invalid")
		}
		switch dynamic.Provenance.Kind {
		case lightfield.SourcePreset, lightfield.SourcePhoto, lightfield.SourceGuided:
		default:
			return errors.New("dynamic source kind is invalid")
		}
	}
	for i, target := range definition.Targets {
		switch target.Type {
		case device.TargetDevice, device.TargetGroup, device.TargetRoom:
			if target.ID == "" || len(target.Expression) != 0 {
				return fmt.Errorf("target %d has invalid direct target data", i)
			}
		case device.TargetExpression:
			if target.ID != "" || len(target.Expression) == 0 {
				return fmt.Errorf("target %d has invalid Selector data", i)
			}
			if err := device.ValidateExpression(target.Expression); err != nil {
				return fmt.Errorf("target %d: %w", i, err)
			}
		default:
			return fmt.Errorf("target %d has invalid type %q", i, target.Type)
		}
	}
	seenLights := map[device.DeviceID]bool{}
	for i, override := range definition.Lighting.Overrides {
		if override.DeviceID == "" || seenLights[override.DeviceID] {
			return fmt.Errorf("light override %d has an empty or duplicate device", i)
		}
		seenLights[override.DeviceID] = true
		switch override.Kind {
		case SceneLightOverrideState:
			if override.State == nil || override.EffectID != "" || override.NativeEffectName != "" {
				return fmt.Errorf("light override %d has invalid state shape", i)
			}
			if desiredStateEmpty(*override.State) {
				return fmt.Errorf("light override %d has no desired state", i)
			}
			if err := validateDesiredState(*override.State); err != nil {
				return fmt.Errorf("light override %d: %w", i, err)
			}
		case SceneLightOverrideEffect:
			if override.State != nil || override.EffectID == "" || override.NativeEffectName != "" {
				return fmt.Errorf("light override %d has invalid effect shape", i)
			}
		case SceneLightOverrideNativeEffect:
			if override.State != nil || override.EffectID != "" || override.NativeEffectName == "" {
				return fmt.Errorf("light override %d has invalid native-effect shape", i)
			}
		default:
			return fmt.Errorf("light override %d has invalid kind %q", i, override.Kind)
		}
	}
	seenSupporting := map[device.DeviceID]bool{}
	for i, supporting := range definition.Supporting {
		if supporting.DeviceID == "" || seenSupporting[supporting.DeviceID] {
			return fmt.Errorf("supporting state %d has an empty or duplicate device", i)
		}
		seenSupporting[supporting.DeviceID] = true
		if desiredStateEmpty(supporting.State) {
			return fmt.Errorf("supporting state %d has no desired state", i)
		}
		if err := validateDesiredState(supporting.State); err != nil {
			return fmt.Errorf("supporting state %d: %w", i, err)
		}
	}
	return nil
}

func desiredStateEmpty(state DesiredState) bool {
	return state.On == nil && state.Brightness == nil && state.ColorTemp == nil && state.Color == nil &&
		state.Transition == nil && state.TargetTemperature == nil && state.HvacMode == nil &&
		state.FanMode == nil && state.Swing == nil
}

func validateDesiredState(state DesiredState) error {
	if state.Brightness != nil && (*state.Brightness < 0 || *state.Brightness > 254) {
		return errors.New("brightness must be between 0 and 254")
	}
	if state.ColorTemp != nil && *state.ColorTemp < 0 {
		return errors.New("colour temperature cannot be negative")
	}
	if state.Color != nil && (state.Color.R < 0 || state.Color.R > 255 || state.Color.G < 0 || state.Color.G > 255 || state.Color.B < 0 || state.Color.B > 255 ||
		!finite(state.Color.X) || !finite(state.Color.Y) || state.Color.X < 0 || state.Color.X > 1 || state.Color.Y < 0 || state.Color.Y > 1) {
		return errors.New("colour is outside RGB/xy bounds")
	}
	if state.Transition != nil && (!finite(*state.Transition) || *state.Transition < 0) {
		return errors.New("transition must be finite and non-negative")
	}
	if state.TargetTemperature != nil && !finite(*state.TargetTemperature) {
		return errors.New("target temperature must be finite")
	}
	return nil
}

func replaceSceneDefinition(ctx context.Context, q *sqlite.Queries, sceneID string, definition SceneDefinition) error {
	if err := q.DeleteSceneLightOverrides(ctx, sceneID); err != nil {
		return fmt.Errorf("delete Scene light overrides: %w", err)
	}
	if err := q.DeleteSceneSupportingStates(ctx, sceneID); err != nil {
		return fmt.Errorf("delete Scene supporting states: %w", err)
	}
	if err := q.DeleteSceneDynamicSamples(ctx, sceneID); err != nil {
		return fmt.Errorf("delete dynamic samples: %w", err)
	}
	if err := q.DeleteSceneDynamicSource(ctx, sceneID); err != nil {
		return fmt.Errorf("delete dynamic source: %w", err)
	}
	if err := q.DeleteSceneTargets(ctx, sceneID); err != nil {
		return fmt.Errorf("delete Scene targets: %w", err)
	}
	for position, target := range definition.Targets {
		expression, err := marshalExpression(target.Expression)
		if err != nil {
			return err
		}
		var targetID *string
		if target.ID != "" {
			value := target.ID
			targetID = &value
		}
		if err := q.InsertSceneTarget(ctx, sqlite.InsertSceneTargetParams{
			SceneID: sceneID, Position: int64(position), TargetType: target.Type,
			TargetID: targetID, Expression: expression, Name: optionalText(target.Name),
		}); err != nil {
			return fmt.Errorf("insert Scene target: %w", err)
		}
	}
	if definition.Lighting.Dynamic != nil {
		if err := saveDynamicSource(ctx, q, sceneID, *definition.Lighting.Dynamic); err != nil {
			return err
		}
	}
	for _, override := range definition.Lighting.Overrides {
		params := lightOverrideParams(sceneID, override)
		if err := q.InsertSceneLightOverride(ctx, params); err != nil {
			return fmt.Errorf("insert Scene light override for %s: %w", override.DeviceID, err)
		}
	}
	for _, supporting := range definition.Supporting {
		params := supportingStateParams(sceneID, supporting)
		if err := q.InsertSceneSupportingState(ctx, params); err != nil {
			return fmt.Errorf("insert Scene supporting state for %s: %w", supporting.DeviceID, err)
		}
	}
	return nil
}

func loadSceneDefinition(ctx context.Context, q *sqlite.Queries, sceneID string) (SceneDefinition, error) {
	rows, err := q.ListSceneTargets(ctx, sceneID)
	if err != nil {
		return SceneDefinition{}, err
	}
	definition := SceneDefinition{Targets: make([]SceneTarget, len(rows))}
	for i, row := range rows {
		definition.Targets[i] = SceneTarget{
			Type: device.TargetType(row.TargetType), ID: textValue(row.TargetID),
			Expression: unmarshalExpression(row.Expression), Name: textValue(row.Name),
		}
	}
	if dynamic, found, err := loadDynamicSource(ctx, q, sceneID); err != nil {
		return SceneDefinition{}, err
	} else if found {
		definition.Lighting.Dynamic = &dynamic
	}
	overrides, err := q.ListSceneLightOverrides(ctx, sceneID)
	if err != nil {
		return SceneDefinition{}, err
	}
	if len(overrides) > 0 {
		definition.Lighting.Overrides = make([]SceneLightOverride, len(overrides))
	}
	for i, row := range overrides {
		override := SceneLightOverride{
			DeviceID: device.DeviceID(row.DeviceID), Kind: SceneLightOverrideKind(row.Kind),
			EffectID: textValue(row.EffectID), NativeEffectName: textValue(row.NativeEffectName),
		}
		if override.Kind == SceneLightOverrideState {
			state := desiredStateFromColumns(
				row.OnState, row.Brightness, row.ColorTemp, row.ColorR, row.ColorG, row.ColorB,
				row.ColorX, row.ColorY, row.Transition, row.TargetTemperature, row.HvacMode, row.FanMode, row.Swing,
			)
			override.State = &state
		}
		definition.Lighting.Overrides[i] = override
	}
	supporting, err := q.ListSceneSupportingStates(ctx, sceneID)
	if err != nil {
		return SceneDefinition{}, err
	}
	if len(supporting) > 0 {
		definition.Supporting = make([]SceneSupportingState, len(supporting))
	}
	for i, row := range supporting {
		definition.Supporting[i] = SceneSupportingState{
			DeviceID: device.DeviceID(row.DeviceID),
			State: desiredStateFromColumns(
				row.OnState, row.Brightness, row.ColorTemp, row.ColorR, row.ColorG, row.ColorB,
				row.ColorX, row.ColorY, row.Transition, row.TargetTemperature, row.HvacMode, row.FanMode, row.Swing,
			),
		}
	}
	if err := ValidateSceneDefinition(definition); err != nil {
		return SceneDefinition{}, err
	}
	return definition, nil
}

func saveDynamicSource(ctx context.Context, q *sqlite.Queries, sceneID string, dynamic DynamicLighting) error {
	var guidedIDs *string
	if len(dynamic.Provenance.GuidedSelectedIDs) > 0 {
		encoded, err := json.Marshal(dynamic.Provenance.GuidedSelectedIDs)
		if err != nil {
			return fmt.Errorf("marshal Guided provenance: %w", err)
		}
		value := string(encoded)
		guidedIDs = &value
	}
	if err := q.UpsertSceneDynamicSource(ctx, sqlite.UpsertSceneDynamicSourceParams{
		SceneID: sceneID, Domain: string(dynamic.Field.Domain), SourceKind: string(dynamic.Provenance.Kind),
		PresetID: optionalText(dynamic.Provenance.PresetID), PresetTitle: optionalText(dynamic.Provenance.PresetTitle),
		GuidedSelectedIds: guidedIDs, Seed: dynamic.Seed, Brightness: dynamic.Brightness, Movement: dynamic.Movement,
		CycleNanos: dynamic.Cycle.Nanoseconds(), GridWidth: int64(dynamic.Field.Width), GridHeight: int64(dynamic.Field.Height),
	}); err != nil {
		return fmt.Errorf("save dynamic lighting: %w", err)
	}
	for position, sample := range dynamic.Field.Samples {
		params := sqlite.InsertSceneDynamicSampleParams{SceneID: sceneID, Position: int64(position)}
		if sample.Color != nil {
			params.Lightness = &sample.Color.Lightness
			params.Chroma = &sample.Color.Chroma
			params.Hue = &sample.Color.Hue
		} else {
			params.Brightness = &sample.White.Brightness
			params.Mireds = &sample.White.Mireds
		}
		if err := q.InsertSceneDynamicSample(ctx, params); err != nil {
			return fmt.Errorf("insert dynamic sample %d: %w", position, err)
		}
	}
	return nil
}

func loadDynamicSource(ctx context.Context, q *sqlite.Queries, sceneID string) (DynamicLighting, bool, error) {
	row, err := q.GetSceneDynamicSource(ctx, sceneID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return DynamicLighting{}, false, nil
		}
		return DynamicLighting{}, false, err
	}
	samples, err := q.ListSceneDynamicSamples(ctx, sceneID)
	if err != nil {
		return DynamicLighting{}, false, err
	}
	field := lightfield.Field{Domain: lightfield.Domain(row.Domain), Width: int(row.GridWidth), Height: int(row.GridHeight), Samples: make([]lightfield.Sample, len(samples))}
	for i, sample := range samples {
		if field.Domain == lightfield.DomainFullColor {
			if sample.Lightness == nil || sample.Chroma == nil || sample.Hue == nil {
				return DynamicLighting{}, false, fmt.Errorf("dynamic sample %d has incomplete colour channels", i)
			}
			field.Samples[i].Color = &lightfield.ColorSample{Lightness: *sample.Lightness, Chroma: *sample.Chroma, Hue: *sample.Hue}
		} else {
			if sample.Brightness == nil || sample.Mireds == nil {
				return DynamicLighting{}, false, fmt.Errorf("dynamic sample %d has incomplete white channels", i)
			}
			field.Samples[i].White = &lightfield.WhiteSample{Brightness: *sample.Brightness, Mireds: *sample.Mireds}
		}
	}
	provenance := lightfield.Provenance{
		Kind: lightfield.SourceKind(row.SourceKind), PresetID: textValue(row.PresetID), PresetTitle: textValue(row.PresetTitle),
		GuidedDomain: field.Domain,
	}
	if row.GuidedSelectedIds != nil {
		if err := json.Unmarshal([]byte(*row.GuidedSelectedIds), &provenance.GuidedSelectedIDs); err != nil {
			return DynamicLighting{}, false, fmt.Errorf("decode Guided provenance: %w", err)
		}
	}
	return DynamicLighting{
		Field: field, Seed: row.Seed, Brightness: row.Brightness, Movement: row.Movement,
		Cycle: time.Duration(row.CycleNanos), Provenance: provenance,
	}, true, nil
}

func lightOverrideParams(sceneID string, override SceneLightOverride) sqlite.InsertSceneLightOverrideParams {
	params := sqlite.InsertSceneLightOverrideParams{
		SceneID: sceneID, DeviceID: string(override.DeviceID), Kind: string(override.Kind),
		EffectID: optionalText(override.EffectID), NativeEffectName: optionalText(override.NativeEffectName),
	}
	if override.State != nil {
		setDesiredStateParams(*override.State, &params.OnState, &params.Brightness, &params.ColorTemp,
			&params.ColorR, &params.ColorG, &params.ColorB, &params.ColorX, &params.ColorY,
			&params.Transition, &params.TargetTemperature, &params.HvacMode, &params.FanMode, &params.Swing)
	}
	return params
}

func supportingStateParams(sceneID string, supporting SceneSupportingState) sqlite.InsertSceneSupportingStateParams {
	params := sqlite.InsertSceneSupportingStateParams{SceneID: sceneID, DeviceID: string(supporting.DeviceID)}
	setDesiredStateParams(supporting.State, &params.OnState, &params.Brightness, &params.ColorTemp,
		&params.ColorR, &params.ColorG, &params.ColorB, &params.ColorX, &params.ColorY,
		&params.Transition, &params.TargetTemperature, &params.HvacMode, &params.FanMode, &params.Swing)
	return params
}

func setDesiredStateParams(state DesiredState, on, brightness, colorTemp, colorR, colorG, colorB **int64,
	colorX, colorY, transition, targetTemperature **float64, hvacMode, fanMode, swing **string,
) {
	*on = boolToNullInt64(state.On)
	*brightness = intPtrToNullInt64(state.Brightness)
	*colorTemp = intPtrToNullInt64(state.ColorTemp)
	*transition = state.Transition
	*targetTemperature = state.TargetTemperature
	*hvacMode = state.HvacMode
	*fanMode = state.FanMode
	*swing = state.Swing
	setColorParams(state.Color, colorR, colorG, colorB, colorX, colorY)
}

func setColorParams(color *device.Color, r, g, b **int64, x, y **float64) {
	if color == nil {
		return
	}
	*r, *g, *b = device.Ptr(int64(color.R)), device.Ptr(int64(color.G)), device.Ptr(int64(color.B))
	*x, *y = &color.X, &color.Y
}

func desiredStateFromColumns(
	on, brightness, colorTemp, colorR, colorG, colorB *int64,
	colorX, colorY, transition, targetTemperature *float64,
	hvacMode, fanMode, swing *string,
) DesiredState {
	state := DesiredState{
		On: nullInt64ToBool(on), Brightness: nullInt64ToIntPtr(brightness), ColorTemp: nullInt64ToIntPtr(colorTemp),
		Transition: transition, TargetTemperature: targetTemperature, HvacMode: hvacMode, FanMode: fanMode, Swing: swing,
	}
	if colorR != nil && colorG != nil && colorB != nil {
		state.Color = &device.Color{R: int(*colorR), G: int(*colorG), B: int(*colorB)}
		if colorX != nil {
			state.Color.X = *colorX
		}
		if colorY != nil {
			state.Color.Y = *colorY
		}
	}
	return state
}

func finiteBounded(value float64) bool {
	return finite(value) && value >= 0 && value <= 1
}

func finite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}

// StartActiveSceneRun atomically replaces one Scene's persisted runtime state.
func (s *DB) StartActiveSceneRun(ctx context.Context, run ActiveSceneRun) error {
	if run.SceneID == "" || run.RunID == "" || run.StartedAt.IsZero() || run.DefinitionUpdatedAt.IsZero() {
		return errors.New("active Scene run identity and timestamps are required")
	}
	return s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.UpsertActiveSceneRun(ctx, sqlite.UpsertActiveSceneRunParams{
			SceneID: run.SceneID, RunID: run.RunID, StartedAt: run.StartedAt,
			DefinitionUpdatedAt: run.DefinitionUpdatedAt,
		}); err != nil {
			return fmt.Errorf("upsert active Scene run: %w", err)
		}
		if err := q.DeleteActiveSceneMembers(ctx, run.SceneID); err != nil {
			return fmt.Errorf("delete active Scene members: %w", err)
		}
		for _, member := range run.Members {
			if err := q.InsertActiveSceneMember(ctx, activeSceneMemberParams(run.SceneID, member)); err != nil {
				return fmt.Errorf("insert active Scene member %q: %w", member.DeviceID, err)
			}
		}
		return nil
	})
}

// UpdateActiveSceneMemberExpected persists the latest desired frame.
func (s *DB) UpdateActiveSceneMemberExpected(ctx context.Context, sceneID string, deviceID device.DeviceID, expected DesiredState) error {
	params := activeExpectedParams(expected)
	params.SceneID = sceneID
	params.DeviceID = deviceID
	if err := s.q.UpdateActiveSceneMemberExpected(ctx, params); err != nil {
		return fmt.Errorf("update active Scene expected state: %w", err)
	}
	return nil
}

// UpdateActiveSceneMemberEffectRun records a supporting effect run identity.
func (s *DB) UpdateActiveSceneMemberEffectRun(ctx context.Context, sceneID string, deviceID device.DeviceID, runID string) error {
	if err := s.q.UpdateActiveSceneMemberEffectRun(ctx, sqlite.UpdateActiveSceneMemberEffectRunParams{
		EffectRunID: optionalText(runID), SceneID: sceneID, DeviceID: deviceID,
	}); err != nil {
		return fmt.Errorf("update active Scene effect run: %w", err)
	}
	return nil
}

// StopActiveSceneRun deletes one persisted run and its member snapshot.
func (s *DB) StopActiveSceneRun(ctx context.Context, sceneID string) (bool, error) {
	count, err := s.q.DeleteActiveSceneRun(ctx, sceneID)
	if err != nil {
		return false, fmt.Errorf("stop active Scene run: %w", err)
	}
	return count > 0, nil
}

// ListActiveSceneRuns loads every persisted run with its members.
func (s *DB) ListActiveSceneRuns(ctx context.Context) ([]ActiveSceneRun, error) {
	runRows, err := s.q.ListActiveSceneRuns(ctx)
	if err != nil {
		return nil, fmt.Errorf("list active Scene runs: %w", err)
	}
	memberRows, err := s.q.ListActiveSceneMembers(ctx)
	if err != nil {
		return nil, fmt.Errorf("list active Scene members: %w", err)
	}
	members := make(map[string][]ActiveSceneMember, len(runRows))
	for _, row := range memberRows {
		members[row.SceneID] = append(members[row.SceneID], activeSceneMemberFromRow(row))
	}
	runs := make([]ActiveSceneRun, len(runRows))
	for i, row := range runRows {
		runs[i] = ActiveSceneRun{
			SceneID: row.SceneID, RunID: row.RunID, StartedAt: row.StartedAt,
			DefinitionUpdatedAt: row.DefinitionUpdatedAt, Members: members[row.SceneID],
		}
	}
	return runs, nil
}

func activeSceneMemberParams(sceneID string, member ActiveSceneMember) sqlite.InsertActiveSceneMemberParams {
	expected := activeExpectedParams(member.Expected)
	return sqlite.InsertActiveSceneMemberParams{
		SceneID: sceneID, DeviceID: member.DeviceID, BehaviorKind: string(member.Kind),
		OwnsOn: boolInt64(member.Owned.On), OwnsBrightness: boolInt64(member.Owned.Brightness),
		OwnsColorTemp: boolInt64(member.Owned.ColorTemp), OwnsColor: boolInt64(member.Owned.Color),
		OwnsTemperature: boolInt64(member.Owned.TargetTemperature), OwnsHvacMode: boolInt64(member.Owned.HvacMode),
		OwnsFanMode: boolInt64(member.Owned.FanMode), OwnsSwing: boolInt64(member.Owned.Swing),
		ExpectedOn: expected.ExpectedOn, ExpectedBrightness: expected.ExpectedBrightness,
		ExpectedColorTemp: expected.ExpectedColorTemp, ExpectedColorR: expected.ExpectedColorR,
		ExpectedColorG: expected.ExpectedColorG, ExpectedColorB: expected.ExpectedColorB,
		ExpectedColorX: expected.ExpectedColorX, ExpectedColorY: expected.ExpectedColorY,
		ExpectedTemperature: expected.ExpectedTemperature, ExpectedHvacMode: expected.ExpectedHvacMode,
		ExpectedFanMode: expected.ExpectedFanMode, ExpectedSwing: expected.ExpectedSwing,
		EffectRunID: optionalText(member.EffectRunID),
	}
}

func activeExpectedParams(expected DesiredState) sqlite.UpdateActiveSceneMemberExpectedParams {
	params := sqlite.UpdateActiveSceneMemberExpectedParams{
		ExpectedOn: boolToNullInt64(expected.On), ExpectedBrightness: intPtrToNullInt64(expected.Brightness),
		ExpectedColorTemp: intPtrToNullInt64(expected.ColorTemp), ExpectedTemperature: expected.TargetTemperature,
		ExpectedHvacMode: expected.HvacMode, ExpectedFanMode: expected.FanMode, ExpectedSwing: expected.Swing,
	}
	setColorParams(expected.Color, &params.ExpectedColorR, &params.ExpectedColorG, &params.ExpectedColorB, &params.ExpectedColorX, &params.ExpectedColorY)
	return params
}

func activeSceneMemberFromRow(row sqlite.ActiveSceneMember) ActiveSceneMember {
	member := ActiveSceneMember{
		DeviceID: device.DeviceID(row.DeviceID), Kind: SceneMemberKind(row.BehaviorKind),
		Owned: SceneOwnedFields{
			On: row.OwnsOn != 0, Brightness: row.OwnsBrightness != 0, ColorTemp: row.OwnsColorTemp != 0,
			Color: row.OwnsColor != 0, TargetTemperature: row.OwnsTemperature != 0,
			HvacMode: row.OwnsHvacMode != 0, FanMode: row.OwnsFanMode != 0, Swing: row.OwnsSwing != 0,
		},
		Expected: desiredStateFromColumns(
			row.ExpectedOn, row.ExpectedBrightness, row.ExpectedColorTemp,
			row.ExpectedColorR, row.ExpectedColorG, row.ExpectedColorB,
			row.ExpectedColorX, row.ExpectedColorY, nil, row.ExpectedTemperature,
			row.ExpectedHvacMode, row.ExpectedFanMode, row.ExpectedSwing,
		),
		EffectRunID: textValue(row.EffectRunID),
	}
	return member
}

func boolInt64(value bool) int64 {
	if value {
		return 1
	}
	return 0
}
