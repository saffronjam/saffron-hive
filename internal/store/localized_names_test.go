package store

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/localization"
)

func TestLocalizedNamesFollowContentLanguageAndCascade(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	if err := s.UpsertSetting(ctx, "i18n.default_content_language", "sv"); err != nil {
		t.Fatal(err)
	}
	if _, err := s.CreateGroup(ctx, CreateGroupParams{ID: "group-1", Name: "Kök"}); err != nil {
		t.Fatal(err)
	}

	names, err := s.ReplaceLocalizedNameSet(ctx, localization.NameSet{
		EntityType:     "group",
		EntityID:       "group-1",
		SourceLanguage: localization.Swedish,
		Translations: map[localization.Language]string{
			localization.English: " Kitchen ",
			localization.Russian: "Кухня",
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if names.Translations[localization.English] != "Kitchen" {
		t.Fatalf("English translation = %q", names.Translations[localization.English])
	}

	sets, err := s.ListLocalizedNameSets(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var found *localization.NameSet
	for index := range sets {
		if sets[index].EntityType == "group" && sets[index].EntityID == "group-1" {
			found = &sets[index]
			break
		}
	}
	if found == nil || found.SourceLanguage != localization.Swedish || found.Translations[localization.Russian] != "Кухня" {
		t.Fatalf("localized name set = %+v", found)
	}

	if err := s.DeleteGroup(ctx, "group-1"); err != nil {
		t.Fatal(err)
	}
	sets, err = s.ListLocalizedNameSets(ctx)
	if err != nil {
		t.Fatal(err)
	}
	for _, names := range sets {
		if names.EntityType == "group" && names.EntityID == "group-1" {
			t.Fatal("localized name subject survived owner deletion")
		}
	}
}

func TestLocalizedNameSourceLanguageIsImmutable(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	if _, err := s.CreateRoom(ctx, CreateRoomParams{ID: "room-1", Name: "Kitchen"}); err != nil {
		t.Fatal(err)
	}
	_, err := s.ReplaceLocalizedNameSet(ctx, localization.NameSet{
		EntityType:     "room",
		EntityID:       "room-1",
		SourceLanguage: localization.Russian,
		Translations:   map[localization.Language]string{},
	})
	if err == nil {
		t.Fatal("source language change was accepted")
	}
}

func TestNestedLocalizedNamesSurviveReorderAndCleanUp(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	if _, err := s.CreateScene(ctx, CreateSceneParams{
		ID: "scene-1", Name: "Evening", Definition: SceneDefinition{Targets: []SceneTarget{
			{EntryID: "selector-1", Type: "expression", Name: "Colour lights", Expression: []device.Clause{{Subject: device.SubjectWritableCapability, Op: device.OpIs, Values: []string{device.CapColor}}}},
			{EntryID: "room-target", Type: "room", ID: "living"},
		}},
	}); err != nil {
		t.Fatal(err)
	}
	if _, err := s.ReplaceLocalizedNameSet(ctx, localization.NameSet{
		EntityType: "scene_target", EntityID: "selector-1", SourceLanguage: localization.English,
		Translations: map[localization.Language]string{localization.Swedish: "Färglampor"},
	}); err != nil {
		t.Fatal(err)
	}
	if err := s.SaveSceneDefinition(ctx, "scene-1", SceneDefinition{Targets: []SceneTarget{
		{EntryID: "room-target", Type: "room", ID: "living"},
		{EntryID: "selector-1", Type: "expression", Name: "Colour lights", Expression: []device.Clause{{Subject: device.SubjectWritableCapability, Op: device.OpIs, Values: []string{device.CapColor}}}},
	}}); err != nil {
		t.Fatal(err)
	}
	assertLocalizedTranslation(t, s, "scene_target", "selector-1", localization.Swedish, "Färglampor")

	if err := s.SaveSceneDefinition(ctx, "scene-1", SceneDefinition{Targets: []SceneTarget{{EntryID: "room-target", Type: "room", ID: "living"}}}); err != nil {
		t.Fatal(err)
	}
	assertLocalizedSubjectMissing(t, s, "scene_target", "selector-1")
}

func assertLocalizedTranslation(t *testing.T, s *DB, entityType, entityID string, language localization.Language, want string) {
	t.Helper()
	sets, err := s.ListLocalizedNameSets(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	for _, names := range sets {
		if names.EntityType == entityType && names.EntityID == entityID {
			if got := names.Translations[language]; got != want {
				t.Fatalf("translation = %q, want %q", got, want)
			}
			return
		}
	}
	t.Fatalf("localized subject %s/%s is missing", entityType, entityID)
}

func assertLocalizedSubjectMissing(t *testing.T, s *DB, entityType, entityID string) {
	t.Helper()
	sets, err := s.ListLocalizedNameSets(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	for _, names := range sets {
		if names.EntityType == entityType && names.EntityID == entityID {
			t.Fatalf("localized subject %s/%s still exists", entityType, entityID)
		}
	}
}
