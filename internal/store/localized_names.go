package store

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/localization"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// ListLocalizedNameSets returns the localization metadata for every named subject.
func (s *DB) ListLocalizedNameSets(ctx context.Context) ([]localization.NameSet, error) {
	subjects, err := s.q.ListLocalizedNameSubjects(ctx)
	if err != nil {
		return nil, fmt.Errorf("list localized name subjects: %w", err)
	}
	rows, err := s.q.ListLocalizedNames(ctx)
	if err != nil {
		return nil, fmt.Errorf("list localized names: %w", err)
	}
	sets := make([]localization.NameSet, len(subjects))
	byKey := make(map[string]*localization.NameSet, len(subjects))
	for i, subject := range subjects {
		sets[i] = localization.NameSet{EntityType: subject.EntityType, EntityID: subject.EntityID, SourceLanguage: localization.Language(subject.SourceLanguage), Translations: map[localization.Language]string{}}
		byKey[subject.EntityType+"\x00"+subject.EntityID] = &sets[i]
	}
	for _, row := range rows {
		if set := byKey[row.EntityType+"\x00"+row.EntityID]; set != nil {
			set.Translations[localization.Language(row.Language)] = row.Value
		}
	}
	return sets, nil
}

// ReplaceLocalizedNameSet replaces every non-source translation atomically.
func (s *DB) ReplaceLocalizedNameSet(ctx context.Context, names localization.NameSet) (localization.NameSet, error) {
	if err := names.Validate(); err != nil {
		return localization.NameSet{}, err
	}
	normalized := make(map[localization.Language]string, len(names.Translations))
	for language, value := range names.Translations {
		normalized[language] = strings.TrimSpace(value)
	}
	names.Translations = normalized
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		subject, err := q.GetLocalizedNameSubject(ctx, sqlite.GetLocalizedNameSubjectParams{EntityType: names.EntityType, EntityID: names.EntityID})
		if err != nil {
			if err == sql.ErrNoRows {
				return fmt.Errorf("localized name subject not found")
			}
			return err
		}
		if subject.SourceLanguage != string(names.SourceLanguage) {
			return fmt.Errorf("source language is immutable")
		}
		if err := q.DeleteLocalizedNamesForSubject(ctx, sqlite.DeleteLocalizedNamesForSubjectParams{EntityType: names.EntityType, EntityID: names.EntityID}); err != nil {
			return err
		}
		for language, value := range names.Translations {
			if err := q.UpsertLocalizedName(ctx, sqlite.UpsertLocalizedNameParams{EntityType: names.EntityType, EntityID: names.EntityID, Language: string(language), Value: value}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return localization.NameSet{}, fmt.Errorf("replace localized name set: %w", err)
	}
	return names, nil
}
