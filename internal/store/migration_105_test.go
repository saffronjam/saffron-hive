package store

import (
	"database/sql"
	"testing"
)

func TestMigration105AssistantNames(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration105?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	m := newMigrate(t, db)
	if err := m.Migrate(104); err != nil {
		t.Fatal(err)
	}
	st := New(db)
	if _, err := st.CreateUser(t.Context(), CreateUserParams{ID: "owner", Username: "owner", Name: "Owner", PasswordHash: "hash"}); err != nil {
		t.Fatal(err)
	}
	for _, title := range []string{"New chat", "Ny chatt", "Новый чат", "My lighting"} {
		if _, err := db.Exec(`INSERT INTO assistant_conversations (id,user_id,title,document,revision,updated_at) VALUES (?,'owner',?, '{"title":"unused","messages":[]}',7,'2026-10-18')`, title, title); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := db.Exec(`INSERT INTO assistant_attachments (id,conversation_id,name,mime,content,created_at) VALUES ('photo','My lighting','photo.png','image/png',x'0102','2026-10-18')`); err != nil {
		t.Fatal(err)
	}
	if err := m.Migrate(105); err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"New chat", "Ny chatt", "Новый чат", "My lighting"} {
		row, err := st.GetAssistantConversation(t.Context(), id, "owner")
		if err != nil {
			t.Fatal(err)
		}
		want := ""
		if id == "My lighting" {
			want = id
		}
		if row.AutoTitle != "" || row.TitleOverride != want || row.Revision != 7 || row.Document != `{"messages":[]}` {
			t.Fatalf("migrated chat: %+v", row)
		}
	}
	if _, err := db.Exec(`UPDATE assistant_conversations SET auto_title='Generated title'`); err != nil {
		t.Fatal(err)
	}
	if err := m.Migrate(104); err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"New chat", "Ny chatt", "Новый чат", "My lighting"} {
		var title string
		if err := db.QueryRow(`SELECT title FROM assistant_conversations WHERE id=?`, id).Scan(&title); err != nil {
			t.Fatal(err)
		}
		want := "Generated title"
		if id == "My lighting" {
			want = id
		}
		if title != want {
			t.Fatalf("title = %q, want %q", title, want)
		}
	}
	if err := m.Migrate(105); err != nil {
		t.Fatal(err)
	}
	if a, err := st.GetAssistantAttachment(t.Context(), "photo", "owner"); err != nil || len(a.Content) != 2 {
		t.Fatalf("attachment: %+v, %v", a, err)
	}
}
