package store

import (
	"context"
	"fmt"

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

// CreateSceneAction inserts a new scene action.
func (s *DB) CreateSceneAction(ctx context.Context, params CreateSceneActionParams) (SceneAction, error) {
	if err := s.q.CreateSceneAction(ctx, sqlite.CreateSceneActionParams{
		ID:         params.ID,
		SceneID:    params.SceneID,
		TargetType: device.TargetType(params.TargetType),
		TargetID:   params.TargetID,
		Payload:    params.Payload,
	}); err != nil {
		return SceneAction{}, fmt.Errorf("create scene action: %w", err)
	}
	return SceneAction{
		ID:         params.ID,
		SceneID:    params.SceneID,
		TargetType: params.TargetType,
		TargetID:   params.TargetID,
		Payload:    params.Payload,
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
			Payload:    r.Payload,
		})
	}
	return actions, nil
}
