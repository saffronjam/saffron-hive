package store

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
)

func TestMigration106ConditionGates(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration106?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	m := newMigrate(t, db)
	if err := m.Migrate(105); err != nil {
		t.Fatal(err)
	}
	exec := func(query string, args ...any) {
		t.Helper()
		if _, err := db.Exec(query, args...); err != nil {
			t.Fatal(err)
		}
	}
	type node struct{ id, kind, config string }
	seed := func(id string, nodes []node, edges [][2]string, enabled bool) {
		exec(`INSERT INTO automations (id,name,enabled,revision) VALUES (?,?,?,7)`, id, id, enabled)
		for i, n := range nodes {
			exec(`INSERT INTO automation_nodes(automation_id,id,type,config,position_x,position_y) VALUES (?,?,?,?,?,?)`, id, n.id, n.kind, n.config, 12, i*40)
		}
		for _, edge := range edges {
			exec(`INSERT INTO automation_edges(automation_id,from_node_id,to_node_id) VALUES (?,?,?)`, id, edge[0], edge[1])
		}
		exec(`INSERT INTO automation_node_state(automation_id,node_id,key,value) VALUES (?,'t','hold','preserved')`, id)
	}
	base := []node{{"t", "trigger", `{"event_type":"device.state_changed","hold_ms":600000}`}, {"c", "condition", `{"expr":"true"}`}, {"a", "action", `{"action_type":"activate_scene","payload":"{\"scene_id\":\"night\"}"}`}}
	andNodes := append(append([]node{}, base...), node{"c2", "condition", `{"expr":"false"}`}, node{"and", "operator", `{"kind":"and"}`})
	andEdges := [][2]string{{"t", "and"}, {"c", "and"}, {"c2", "and"}, {"and", "a"}}
	seed("and", andNodes, andEdges, true)
	seed("draft", andNodes, andEdges, false)
	seed("simple", base, [][2]string{{"t", "c"}, {"c", "a"}}, true)
	seed("inverted", append(append([]node{}, base...), node{"not", "operator", `{"kind":"not"}`}), [][2]string{{"t", "c"}, {"c", "not"}, {"not", "a"}}, true)
	seed("macro", []node{base[0], {"c", "condition", `{"use":"night","negate":true}`}, base[2], {"not", "operator", `{"kind":"not"}`}}, [][2]string{{"t", "c"}, {"c", "not"}, {"not", "a"}}, true)
	seed("or-triggers", append(append([]node{}, andNodes...), node{"t2", "trigger", `{"event_type":"test"}`}, node{"or", "operator", `{"kind":"or"}`}), [][2]string{{"t", "or"}, {"t2", "or"}, {"or", "and"}, {"c", "and"}, {"c2", "and"}, {"and", "a"}}, true)
	seed("unsafe", append(append([]node{}, base...), node{"c2", "condition", `{"expr":"false"}`}), [][2]string{{"t", "c"}, {"c", "c2"}, {"c2", "a"}}, true)
	seed("unsafe-not", append(append([]node{}, base...), node{"not", "operator", `{"kind":"not"}`}), [][2]string{{"t", "a"}, {"c", "not"}, {"not", "a"}}, true)
	mixedNodes := append(append([]node{}, andNodes...), node{"root", "condition", `{"expr":"true"}`}, node{"b", "action", base[2].config})
	seed("mixed", mixedNodes, append(append([][2]string{}, andEdges...), [2]string{"root", "b"}), true)
	seed("incomplete", []node{base[0], {"c", "condition", `{"draft":{"condition":{"mode":"unset","negate":true}}}`}, base[2], {"not", "operator", `{"kind":"not"}`}}, [][2]string{{"t", "c"}, {"c", "not"}, {"not", "a"}}, false)
	seed("malformed", []node{base[0], {"c", "condition", `invalid`}, base[2], {"not", "operator", `{"kind":"not"}`}}, [][2]string{{"t", "c"}, {"c", "not"}, {"not", "a"}}, true)
	snapshots := map[string]string{}
	snapshot := func(id string) string {
		t.Helper()
		var value string
		err := db.QueryRow(`SELECT json_object('nodes',(SELECT json_group_array(json_object('id',id,'type',type,'config',config,'x',position_x,'y',position_y)) FROM (SELECT * FROM automation_nodes WHERE automation_id=? ORDER BY id)), 'edges',(SELECT json_group_array(json_array(from_node_id,to_node_id)) FROM (SELECT * FROM automation_edges WHERE automation_id=? ORDER BY from_node_id,to_node_id)))`, id, id).Scan(&value)
		if err != nil {
			t.Fatal(err)
		}
		return value
	}
	for _, id := range []string{"simple", "unsafe", "unsafe-not", "mixed", "incomplete", "malformed"} {
		snapshots[id] = snapshot(id)
	}
	if err := m.Migrate(106); err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"and", "draft", "simple", "inverted", "macro", "or-triggers", "unsafe", "unsafe-not", "mixed", "incomplete", "malformed"} {
		t.Run(id, func(t *testing.T) {
			var enabled bool
			var revision int
			if err := db.QueryRow(`SELECT enabled,revision FROM automations WHERE id=?`, id).Scan(&enabled, &revision); err != nil {
				t.Fatal(err)
			}
			wantEnabled := id != "draft" && id != "unsafe" && id != "unsafe-not" && id != "mixed" && id != "incomplete" && id != "malformed"
			wantRevision := 8
			if id == "simple" || id == "incomplete" {
				wantRevision = 7
			}
			if enabled != wantEnabled || revision != wantRevision {
				t.Fatalf("enabled=%v revision=%d", enabled, revision)
			}
			if before, ok := snapshots[id]; ok && snapshot(id) != before {
				t.Fatal("graph changed unexpectedly")
			}
			var hold string
			if err := db.QueryRow(`SELECT value FROM automation_node_state WHERE automation_id=? AND node_id='t'`, id).Scan(&hold); err != nil || hold != "preserved" {
				t.Fatalf("hold=%s err=%v", hold, err)
			}
			if id == "and" || id == "draft" || id == "or-triggers" {
				var edges string
				if err := db.QueryRow(`SELECT group_concat(from_node_id||'>'||to_node_id, ',') FROM (SELECT * FROM automation_edges WHERE automation_id=? ORDER BY from_node_id,to_node_id)`, id).Scan(&edges); err != nil {
					t.Fatal(err)
				}
				want := "c>c2,c2>a,t>c"
				if id == "or-triggers" {
					want = "c>c2,c2>a,or>c,t>or,t2>or"
				}
				if edges != want {
					t.Fatalf("edges=%s want=%s", edges, want)
				}
			}
			if id == "inverted" || id == "macro" {
				var config string
				if err := db.QueryRow(`SELECT config FROM automation_nodes WHERE automation_id=? AND id='c'`, id).Scan(&config); err != nil {
					t.Fatal(err)
				}
				var c struct{ Negate bool }
				if err := json.Unmarshal([]byte(config), &c); err != nil {
					t.Fatal(err)
				}
				if c.Negate != (id == "inverted") {
					t.Fatalf("config=%s", config)
				}
			}
		})
	}
	if err := m.Migrate(105); err == nil || !strings.Contains(fmt.Sprint(err), "restore_database_backup") {
		t.Fatalf("downgrade must require backup: %v", err)
	}
}

func TestMigration106EmptyUpgradeAndDowngrade(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration106empty?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	m := newMigrate(t, db)
	for _, version := range []uint{106, 105, 106} {
		if err := m.Migrate(version); err != nil {
			t.Fatalf("version %d: %v", version, err)
		}
	}
}
