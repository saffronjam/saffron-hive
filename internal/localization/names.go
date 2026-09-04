// Package localization defines language-independent naming data.
package localization

import (
	"fmt"
	"strings"
)

// Language is a supported content language.
type Language string

const (
	English Language = "en"
	Swedish Language = "sv"
	Russian Language = "ru"
)

// NameSet identifies an entity's immutable source language and optional translations.
type NameSet struct {
	EntityType     string
	EntityID       string
	SourceLanguage Language
	Translations   map[Language]string
}

func ValidLanguage(language Language) bool {
	return language == English || language == Swedish || language == Russian
}

// Validate checks identity, language, and translation invariants.
func (names NameSet) Validate() error {
	if strings.TrimSpace(names.EntityType) == "" || strings.TrimSpace(names.EntityID) == "" {
		return fmt.Errorf("localized name identity is required")
	}
	if !ValidLanguage(names.SourceLanguage) {
		return fmt.Errorf("unsupported source language %q", names.SourceLanguage)
	}
	for language, value := range names.Translations {
		if !ValidLanguage(language) || language == names.SourceLanguage {
			return fmt.Errorf("invalid translation language %q", language)
		}
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("translation %q is empty", language)
		}
	}
	return nil
}

// Resolve returns the active translation, then source name, provider fallback, and ID.
func (names NameSet) Resolve(active Language, sourceName, fallback string) string {
	if value := strings.TrimSpace(names.Translations[active]); active != names.SourceLanguage && value != "" {
		return value
	}
	if value := strings.TrimSpace(sourceName); value != "" {
		return value
	}
	if value := strings.TrimSpace(fallback); value != "" {
		return value
	}
	return names.EntityID
}
