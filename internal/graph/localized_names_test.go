package graph

import (
	"encoding/json"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/localization"
)

func TestLocalizedNameSetQueryAndMutation(t *testing.T) {
	env := newTestEnv(t)
	env.store.localizedNames["room\x00room-1"] = localization.NameSet{
		EntityType:     "room",
		EntityID:       "room-1",
		SourceLanguage: localization.English,
		Translations:   map[localization.Language]string{localization.Swedish: "Kök"},
	}

	response := env.query(t, `{ localizedNameSets { entityType entityId sourceLanguage translations { language value } } }`, nil)
	if len(response.Errors) != 0 {
		t.Fatalf("query errors: %+v", response.Errors)
	}
	var queryBody struct {
		LocalizedNameSets []struct {
			EntityType     string `json:"entityType"`
			EntityID       string `json:"entityId"`
			SourceLanguage string `json:"sourceLanguage"`
		} `json:"localizedNameSets"`
	}
	if err := json.Unmarshal(response.Data, &queryBody); err != nil {
		t.Fatal(err)
	}
	if len(queryBody.LocalizedNameSets) != 1 || queryBody.LocalizedNameSets[0].SourceLanguage != "EN" {
		t.Fatalf("localized name sets = %+v", queryBody.LocalizedNameSets)
	}

	response = env.query(t, `mutation($input: LocalizedNameSetInput!) {
		updateLocalizedNameSet(input: $input) { entityId sourceLanguage translations { language value } }
	}`, map[string]any{
		"input": map[string]any{
			"entityType":     "room",
			"entityId":       "room-1",
			"sourceLanguage": "EN",
			"translations":   []map[string]any{{"language": "RU", "value": "Кухня"}},
		},
	})
	if len(response.Errors) != 0 {
		t.Fatalf("mutation errors: %+v", response.Errors)
	}
	if got := env.store.localizedNames["room\x00room-1"].Translations[localization.Russian]; got != "Кухня" {
		t.Fatalf("Russian translation = %q", got)
	}
}
