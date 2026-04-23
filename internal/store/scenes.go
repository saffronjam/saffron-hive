package store

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateScene inserts a new scene and returns it.
func (s *DB) CreateScene(ctx context.Context, params CreateSceneParams) (Scene, error) {
	if err := s.q.CreateScene(ctx, sqlite.CreateSceneParams{
		ID:        params.ID,
		Name:      params.Name,
		CreatedBy: params.CreatedBy,
	}); err != nil {
		return Scene{}, fmt.Errorf("create scene: %w", err)
	}
	return s.GetScene(ctx, params.ID)
}

// GetScene retrieves a scene by its ID.
func (s *DB) GetScene(ctx context.Context, id string) (Scene, error) {
	row, err := s.q.GetScene(ctx, id)
	if err != nil {
		return Scene{}, fmt.Errorf("get scene: %w", err)
	}
	return Scene{
		ID:        row.ID,
		Name:      row.Name,
		Icon:      row.Icon,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
		CreatedBy: userRefFromPtrs(row.CreatorID, row.CreatorUsername, row.CreatorName),
	}, nil
}

// ListScenes returns all scenes.
func (s *DB) ListScenes(ctx context.Context) ([]Scene, error) {
	rows, err := s.q.ListScenes(ctx)
	if err != nil {
		return nil, fmt.Errorf("list scenes: %w", err)
	}
	var scenes []Scene
	for _, r := range rows {
		scenes = append(scenes, Scene{
			ID:        r.ID,
			Name:      r.Name,
			Icon:      r.Icon,
			CreatedAt: r.CreatedAt,
			UpdatedAt: r.UpdatedAt,
			CreatedBy: userRefFromPtrs(r.CreatorID, r.CreatorUsername, r.CreatorName),
		})
	}
	return scenes, nil
}

// UpdateScene updates a scene's mutable fields.
func (s *DB) UpdateScene(ctx context.Context, id string, params UpdateSceneParams) (Scene, error) {
	if params.Name != nil {
		if err := s.q.UpdateSceneName(ctx, sqlite.UpdateSceneNameParams{
			Name: *params.Name,
			ID:   id,
		}); err != nil {
			return Scene{}, fmt.Errorf("update scene name: %w", err)
		}
	}
	if params.SetIcon {
		if params.Icon == nil {
			if err := s.q.ClearSceneIcon(ctx, id); err != nil {
				return Scene{}, fmt.Errorf("clear scene icon: %w", err)
			}
		} else {
			if err := s.q.UpdateSceneIcon(ctx, sqlite.UpdateSceneIconParams{
				Icon: params.Icon,
				ID:   id,
			}); err != nil {
				return Scene{}, fmt.Errorf("update scene icon: %w", err)
			}
		}
	}
	return s.GetScene(ctx, id)
}

// DeleteScene deletes a scene by its ID. Cascading deletes remove associated actions.
func (s *DB) DeleteScene(ctx context.Context, id string) error {
	if err := s.q.DeleteScene(ctx, id); err != nil {
		return fmt.Errorf("delete scene: %w", err)
	}
	return nil
}

// BatchDeleteScenes deletes the scenes with the given IDs. Returns the number
// of rows actually deleted; missing IDs are silently ignored.
func (s *DB) BatchDeleteScenes(ctx context.Context, ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	js, err := marshalStringArray(ids)
	if err != nil {
		return 0, fmt.Errorf("batch delete scenes: %w", err)
	}
	n, err := s.q.BatchDeleteScenes(ctx, js)
	if err != nil {
		return 0, fmt.Errorf("batch delete scenes: %w", err)
	}
	return n, nil
}

// CreateSceneAction inserts a new scene action.
func (s *DB) CreateSceneAction(ctx context.Context, params CreateSceneActionParams) (SceneAction, error) {
	if err := s.q.CreateSceneAction(ctx, sqlite.CreateSceneActionParams{
		ID:         params.ID,
		SceneID:    params.SceneID,
		TargetType: device.TargetType(params.TargetType),
		TargetID:   params.TargetID,
	}); err != nil {
		return SceneAction{}, fmt.Errorf("create scene action: %w", err)
	}
	return SceneAction{
		ID:         params.ID,
		SceneID:    params.SceneID,
		TargetType: params.TargetType,
		TargetID:   params.TargetID,
	}, nil
}

// DeleteSceneAction deletes a scene action by its ID.
func (s *DB) DeleteSceneAction(ctx context.Context, id string) error {
	if err := s.q.DeleteSceneAction(ctx, id); err != nil {
		return fmt.Errorf("delete scene action: %w", err)
	}
	return nil
}

// ListSceneActions returns all actions belonging to a scene.
func (s *DB) ListSceneActions(ctx context.Context, sceneID string) ([]SceneAction, error) {
	rows, err := s.q.ListSceneActions(ctx, sceneID)
	if err != nil {
		return nil, fmt.Errorf("list scene actions: %w", err)
	}
	var actions []SceneAction
	for _, r := range rows {
		actions = append(actions, SceneAction{
			ID:         r.ID,
			SceneID:    r.SceneID,
			TargetType: string(r.TargetType),
			TargetID:   r.TargetID,
		})
	}
	return actions, nil
}

// ListSceneDevicePayloads returns all per-device payloads for a scene.
func (s *DB) ListSceneDevicePayloads(ctx context.Context, sceneID string) ([]SceneDevicePayload, error) {
	rows, err := s.q.ListSceneDevicePayloads(ctx, sceneID)
	if err != nil {
		return nil, fmt.Errorf("list scene device payloads: %w", err)
	}
	var payloads []SceneDevicePayload
	for _, r := range rows {
		payloads = append(payloads, SceneDevicePayload{
			SceneID:  r.SceneID,
			DeviceID: r.DeviceID,
			Payload:  r.Payload,
		})
	}
	return payloads, nil
}

// SaveSceneContent atomically replaces a scene's target membership and
// per-device payloads. All deletes and inserts happen inside a single
// transaction so concurrent readers never observe a half-written scene.
func (s *DB) SaveSceneContent(ctx context.Context, params SaveSceneContentParams) error {
	return s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.DeleteSceneActionsByScene(ctx, params.SceneID); err != nil {
			return fmt.Errorf("delete scene actions: %w", err)
		}
		if err := q.DeleteSceneDevicePayloadsByScene(ctx, params.SceneID); err != nil {
			return fmt.Errorf("delete scene device payloads: %w", err)
		}
		for _, t := range params.Targets {
			if err := q.CreateSceneAction(ctx, sqlite.CreateSceneActionParams{
				ID:         uuid.New().String(),
				SceneID:    params.SceneID,
				TargetType: device.TargetType(t.TargetType),
				TargetID:   t.TargetID,
			}); err != nil {
				return fmt.Errorf("insert scene action: %w", err)
			}
		}
		for _, p := range params.Payloads {
			if err := q.UpsertSceneDevicePayload(ctx, sqlite.UpsertSceneDevicePayloadParams{
				SceneID:  params.SceneID,
				DeviceID: p.DeviceID,
				Payload:  p.Payload,
			}); err != nil {
				return fmt.Errorf("upsert scene device payload: %w", err)
			}
		}
		return nil
	})
}
