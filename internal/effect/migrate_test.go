package effect

import (
	"context"
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

// fakeMigrationDB satisfies stepMigrationDB for the migration tests.
type fakeMigrationDB struct {
	db *sql.DB
}

func (f fakeMigrationDB) RawDB() *sql.DB { return f.db }

func newMigrationFixtureDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	if _, err := db.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		t.Fatalf("fk pragma: %v", err)
	}

	stmts := []string{
		`CREATE TABLE effects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            loop INTEGER NOT NULL DEFAULT 0,
            duration_ms INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
		`CREATE TABLE effect_steps (
            id TEXT PRIMARY KEY,
            effect_id TEXT NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
            step_index INTEGER NOT NULL,
            kind TEXT NOT NULL,
            config TEXT NOT NULL
        )`,
		`CREATE TABLE effect_tracks (
            id TEXT PRIMARY KEY,
            effect_id TEXT NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
            track_index INTEGER NOT NULL
        )`,
		`CREATE TABLE effect_clips (
            id TEXT PRIMARY KEY,
            track_id TEXT NOT NULL REFERENCES effect_tracks(id) ON DELETE CASCADE,
            start_ms INTEGER NOT NULL,
            transition_min_ms INTEGER NOT NULL,
            transition_max_ms INTEGER NOT NULL,
            kind TEXT NOT NULL,
            config TEXT NOT NULL
        )`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("schema: %v", err)
		}
	}
	return db
}

type stepFixture struct {
	id     string
	idx    int
	kind   string
	config string
}

func seedEffect(t *testing.T, db *sql.DB, id string, loop bool, steps []stepFixture) {
	t.Helper()
	loopVal := 0
	if loop {
		loopVal = 1
	}
	if _, err := db.Exec(`INSERT INTO effects (id, name, kind, loop) VALUES (?, ?, 'timeline', ?)`,
		id, id, loopVal); err != nil {
		t.Fatalf("insert effect %s: %v", id, err)
	}
	for _, s := range steps {
		if _, err := db.Exec(`INSERT INTO effect_steps (id, effect_id, step_index, kind, config) VALUES (?, ?, ?, ?, ?)`,
			s.id, id, s.idx, s.kind, s.config); err != nil {
			t.Fatalf("insert step %s: %v", s.id, err)
		}
	}
}

func loadClips(t *testing.T, db *sql.DB, effectID string) []EffectClipRow {
	t.Helper()
	rows, err := db.Query(`
        SELECT c.id, c.start_ms, c.transition_min_ms, c.transition_max_ms, c.kind, c.config
        FROM effect_clips c
        JOIN effect_tracks t ON t.id = c.track_id
        WHERE t.effect_id = ?
        ORDER BY c.start_ms, c.id`, effectID)
	if err != nil {
		t.Fatalf("query clips: %v", err)
	}
	defer func() { _ = rows.Close() }()
	var out []EffectClipRow
	for rows.Next() {
		var r EffectClipRow
		if err := rows.Scan(&r.ID, &r.StartMs, &r.TransitionMinMs, &r.TransitionMaxMs, &r.Kind, &r.Config); err != nil {
			t.Fatalf("scan: %v", err)
		}
		out = append(out, r)
	}
	return out
}

// EffectClipRow is the test-side projection used by loadClips.
type EffectClipRow struct {
	ID, Kind, Config                          string
	StartMs, TransitionMinMs, TransitionMaxMs int
}

func loadDuration(t *testing.T, db *sql.DB, effectID string) int {
	t.Helper()
	var n int
	if err := db.QueryRow(`SELECT duration_ms FROM effects WHERE id = ?`, effectID).Scan(&n); err != nil {
		t.Fatalf("query duration: %v", err)
	}
	return n
}

func loadTrackCount(t *testing.T, db *sql.DB, effectID string) int {
	t.Helper()
	var n int
	if err := db.QueryRow(`SELECT COUNT(*) FROM effect_tracks WHERE effect_id = ?`, effectID).Scan(&n); err != nil {
		t.Fatalf("query track count: %v", err)
	}
	return n
}

func TestMigrateEffectStepsToTracks_NoWaits(t *testing.T) {
	db := newMigrationFixtureDB(t)
	seedEffect(t, db, "no-waits", true, []stepFixture{
		{id: "s1", idx: 0, kind: "set_brightness", config: `{"value":50,"transition_ms":200}`},
		{id: "s2", idx: 1, kind: "set_brightness", config: `{"value":150,"transition_ms":300}`},
	})

	if err := MigrateEffectStepsToTracks(context.Background(), fakeMigrationDB{db: db}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	if got := loadTrackCount(t, db, "no-waits"); got != 1 {
		t.Fatalf("track count = %d, want 1", got)
	}
	clips := loadClips(t, db, "no-waits")
	if len(clips) != 2 {
		t.Fatalf("clips = %d, want 2", len(clips))
	}
	if clips[0].StartMs != 0 || clips[0].TransitionMinMs != 200 || clips[0].TransitionMaxMs != 200 {
		t.Errorf("clip 0 = %+v", clips[0])
	}
	if clips[1].StartMs != 200 || clips[1].TransitionMinMs != 300 || clips[1].TransitionMaxMs != 300 {
		t.Errorf("clip 1 = %+v", clips[1])
	}
	if got, want := loadDuration(t, db, "no-waits"), 200+300+stepLoopTailMs; got != want {
		t.Errorf("duration = %d, want %d", got, want)
	}
}

func TestMigrateEffectStepsToTracks_LeadingWait(t *testing.T) {
	db := newMigrationFixtureDB(t)
	seedEffect(t, db, "leading-wait", false, []stepFixture{
		{id: "w1", idx: 0, kind: "wait", config: `{"duration_ms":500}`},
		{id: "s1", idx: 1, kind: "set_on_off", config: `{"value":true,"transition_ms":0}`},
	})

	if err := MigrateEffectStepsToTracks(context.Background(), fakeMigrationDB{db: db}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	clips := loadClips(t, db, "leading-wait")
	if len(clips) != 1 {
		t.Fatalf("clips = %d, want 1", len(clips))
	}
	if clips[0].StartMs != 500 {
		t.Errorf("clip startMs = %d, want 500 (absorbed leading wait)", clips[0].StartMs)
	}
	if got := loadDuration(t, db, "leading-wait"); got != 500 {
		t.Errorf("duration = %d, want 500 (no loop tail when loop=false)", got)
	}
}

func TestMigrateEffectStepsToTracks_TrailingWait(t *testing.T) {
	db := newMigrationFixtureDB(t)
	seedEffect(t, db, "trailing-wait", true, []stepFixture{
		{id: "s1", idx: 0, kind: "set_brightness", config: `{"value":80,"transition_ms":100}`},
		{id: "w1", idx: 1, kind: "wait", config: `{"duration_ms":250}`},
	})

	if err := MigrateEffectStepsToTracks(context.Background(), fakeMigrationDB{db: db}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	clips := loadClips(t, db, "trailing-wait")
	if len(clips) != 1 {
		t.Fatalf("clips = %d, want 1", len(clips))
	}
	if clips[0].StartMs != 0 || clips[0].TransitionMaxMs != 100 {
		t.Errorf("clip = %+v, want startMs=0 transition=100", clips[0])
	}
	// Trailing wait does not push duration further: duration is computed from
	// max(clip end), not cumulative time. Plus the loop tail.
	if got, want := loadDuration(t, db, "trailing-wait"), 100+stepLoopTailMs; got != want {
		t.Errorf("duration = %d, want %d", got, want)
	}
}

func TestMigrateEffectStepsToTracks_AllWaits(t *testing.T) {
	db := newMigrationFixtureDB(t)
	seedEffect(t, db, "all-waits", true, []stepFixture{
		{id: "w1", idx: 0, kind: "wait", config: `{"duration_ms":100}`},
		{id: "w2", idx: 1, kind: "wait", config: `{"duration_ms":200}`},
	})

	if err := MigrateEffectStepsToTracks(context.Background(), fakeMigrationDB{db: db}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	if got := loadTrackCount(t, db, "all-waits"); got != 1 {
		t.Fatalf("track count = %d, want 1 (track inserted even with no clips)", got)
	}
	clips := loadClips(t, db, "all-waits")
	if len(clips) != 0 {
		t.Errorf("clips = %d, want 0 (all-wait effect has no clips)", len(clips))
	}
	if got, want := loadDuration(t, db, "all-waits"), stepLoopTailMs; got != want {
		t.Errorf("duration = %d, want %d (only loop tail)", got, want)
	}
}

func TestMigrateEffectStepsToTracks_MixedSequence(t *testing.T) {
	db := newMigrationFixtureDB(t)
	seedEffect(t, db, "mixed", true, []stepFixture{
		{id: "s1", idx: 0, kind: "set_color_rgb", config: `{"r":255,"g":0,"b":0,"transition_ms":300}`},
		{id: "w1", idx: 1, kind: "wait", config: `{"duration_ms":500}`},
		{id: "s2", idx: 2, kind: "set_brightness", config: `{"value":150,"transition_ms":100}`},
		{id: "w2", idx: 3, kind: "wait", config: `{"duration_ms":200}`},
		{id: "s3", idx: 4, kind: "set_color_temp", config: `{"mireds":370,"transition_ms":400}`},
	})

	if err := MigrateEffectStepsToTracks(context.Background(), fakeMigrationDB{db: db}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	clips := loadClips(t, db, "mixed")
	if len(clips) != 3 {
		t.Fatalf("clips = %d, want 3", len(clips))
	}
	// s1: startMs 0, trans 300
	// w1: 500
	// s2: startMs = 0 + 300 + 500 = 800, trans 100
	// w2: 200
	// s3: startMs = 800 + 100 + 200 = 1100, trans 400
	if clips[0].StartMs != 0 || clips[0].Kind != "set_color_rgb" || clips[0].TransitionMaxMs != 300 {
		t.Errorf("clip 0 = %+v", clips[0])
	}
	if clips[1].StartMs != 800 || clips[1].Kind != "set_brightness" || clips[1].TransitionMaxMs != 100 {
		t.Errorf("clip 1 = %+v", clips[1])
	}
	if clips[2].StartMs != 1100 || clips[2].Kind != "set_color_temp" || clips[2].TransitionMaxMs != 400 {
		t.Errorf("clip 2 = %+v", clips[2])
	}
	// max end = 1100 + 400 = 1500, plus loop tail
	if got, want := loadDuration(t, db, "mixed"), 1500+stepLoopTailMs; got != want {
		t.Errorf("duration = %d, want %d", got, want)
	}
}

func TestMigrateEffectStepsToTracks_NoEffectStepsTable(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	if _, err := db.Exec(`CREATE TABLE effects (id TEXT PRIMARY KEY)`); err != nil {
		t.Fatalf("seed: %v", err)
	}
	if err := MigrateEffectStepsToTracks(context.Background(), fakeMigrationDB{db: db}); err != nil {
		t.Fatalf("migrate should be no-op when effect_steps absent, got: %v", err)
	}
}

func TestMigrateEffectStepsToTracks_SkipsAlreadyMigratedEffect(t *testing.T) {
	db := newMigrationFixtureDB(t)
	seedEffect(t, db, "premigrated", true, []stepFixture{
		{id: "s1", idx: 0, kind: "set_brightness", config: `{"value":50,"transition_ms":100}`},
	})
	// Pre-existing track suggests a previous migration run finished for this effect.
	if _, err := db.Exec(`INSERT INTO effect_tracks (id, effect_id, track_index) VALUES ('t-existing', 'premigrated', 0)`); err != nil {
		t.Fatalf("seed track: %v", err)
	}

	if err := MigrateEffectStepsToTracks(context.Background(), fakeMigrationDB{db: db}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	if got := loadTrackCount(t, db, "premigrated"); got != 1 {
		t.Errorf("tracks = %d, want 1 (pre-existing not duplicated)", got)
	}
}
