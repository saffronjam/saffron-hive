package graph

import (
	"sort"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/localization"
)

func localizationLanguage(language model.Language) localization.Language {
	return localization.Language(strings.ToLower(string(language)))
}

func modelLanguage(language localization.Language) model.Language {
	return model.Language(strings.ToUpper(string(language)))
}

func localizedNameSetFromInput(input model.LocalizedNameSetInput) localization.NameSet {
	translations := make(map[localization.Language]string, len(input.Translations))
	for _, translation := range input.Translations {
		translations[localizationLanguage(translation.Language)] = translation.Value
	}
	return localization.NameSet{EntityType: input.EntityType, EntityID: input.EntityID, SourceLanguage: localizationLanguage(input.SourceLanguage), Translations: translations}
}

func mapLocalizedNameSet(names localization.NameSet) *model.LocalizedNameSet {
	languages := make([]string, 0, len(names.Translations))
	for language := range names.Translations {
		languages = append(languages, string(language))
	}
	sort.Strings(languages)
	translations := make([]*model.LocalizedName, 0, len(languages))
	for _, language := range languages {
		translations = append(translations, &model.LocalizedName{Language: modelLanguage(localization.Language(language)), Value: names.Translations[localization.Language(language)]})
	}
	return &model.LocalizedNameSet{EntityType: names.EntityType, EntityID: names.EntityID, SourceLanguage: modelLanguage(names.SourceLanguage), Translations: translations}
}
