package store

import (
	"context"
	"database/sql"
	"fmt"
)

const sceneSelectColumns = `s.id, s.name, s.icon, s.created_at, s.updated_at, u.id, u.username, u.name`

// CreateScene inserts a new scene and returns it.
func (s *SQLiteStore) CreateScene(ctx context.Context, params CreateSceneParams) (Scene, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO scenes (id, name, created_by) VALUES (?, ?, ?)`,
		params.ID, params.Name, params.CreatedBy,
	)
	if err != nil {
		return Scene{}, fmt.Errorf("create scene: %w", err)
	}
	return s.GetScene(ctx, params.ID)
}

// GetScene retrieves a scene by its ID.
func (s *SQLiteStore) GetScene(ctx context.Context, id string) (Scene, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT `+sceneSelectColumns+`
		 FROM scenes s LEFT JOIN users u ON u.id = s.created_by
		 WHERE s.id = ?`, id,
	)
	sc, err := scanScene(row)
	if err != nil {
		return Scene{}, fmt.Errorf("get scene: %w", err)
	}
	return sc, nil
}

// ListScenes returns all scenes.
func (s *SQLiteStore) ListScenes(ctx context.Context) ([]Scene, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+sceneSelectColumns+`
		 FROM scenes s LEFT JOIN users u ON u.id = s.created_by`,
	)
	if err != nil {
		return nil, fmt.Errorf("list scenes: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var scenes []Scene
	for rows.Next() {
		sc, err := scanScene(rows)
		if err != nil {
			return nil, fmt.Errorf("scan scene: %w", err)
		}
		scenes = append(scenes, sc)
	}
	return scenes, rows.Err()
}

// UpdateScene updates a scene's mutable fields.
func (s *SQLiteStore) UpdateScene(ctx context.Context, id string, params UpdateSceneParams) (Scene, error) {
	if params.Name != nil {
		_, err := s.db.ExecContext(ctx,
			`UPDATE scenes SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			*params.Name, id,
		)
		if err != nil {
			return Scene{}, fmt.Errorf("update scene name: %w", err)
		}
	}
	if params.SetIcon {
		var iconArg any
		if params.Icon != nil {
			iconArg = *params.Icon
		}
		_, err := s.db.ExecContext(ctx,
			`UPDATE scenes SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			iconArg, id,
		)
		if err != nil {
			return Scene{}, fmt.Errorf("update scene icon: %w", err)
		}
	}
	return s.GetScene(ctx, id)
}

// DeleteScene deletes a scene by its ID. Cascading deletes remove associated actions.
func (s *SQLiteStore) DeleteScene(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM scenes WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete scene: %w", err)
	}
	return nil
}

// CreateSceneAction inserts a new scene action.
func (s *SQLiteStore) CreateSceneAction(ctx context.Context, params CreateSceneActionParams) (SceneAction, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO scene_actions (id, scene_id, target_type, target_id, payload) VALUES (?, ?, ?, ?, ?)`,
		params.ID, params.SceneID, params.TargetType, params.TargetID, params.Payload,
	)
	if err != nil {
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
func (s *SQLiteStore) DeleteSceneAction(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM scene_actions WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete scene action: %w", err)
	}
	return nil
}

// ListSceneActions returns all actions belonging to a scene.
func (s *SQLiteStore) ListSceneActions(ctx context.Context, sceneID string) ([]SceneAction, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, scene_id, target_type, target_id, payload FROM scene_actions WHERE scene_id = ?`, sceneID,
	)
	if err != nil {
		return nil, fmt.Errorf("list scene actions: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var actions []SceneAction
	for rows.Next() {
		var a SceneAction
		if err := rows.Scan(&a.ID, &a.SceneID, &a.TargetType, &a.TargetID, &a.Payload); err != nil {
			return nil, fmt.Errorf("scan scene action: %w", err)
		}
		actions = append(actions, a)
	}
	return actions, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanScene(row rowScanner) (Scene, error) {
	var sc Scene
	var creatorID, creatorUsername, creatorName sql.NullString
	if err := row.Scan(&sc.ID, &sc.Name, &sc.Icon, &sc.CreatedAt, &sc.UpdatedAt, &creatorID, &creatorUsername, &creatorName); err != nil {
		return Scene{}, err
	}
	sc.CreatedBy = buildUserRef(creatorID, creatorUsername, creatorName)
	return sc, nil
}
