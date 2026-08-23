package webhook

import "testing"

func TestMatchFiltersAcrossRequestSources(t *testing.T) {
	event := Event{
		Body: map[string]any{
			"pipeline": map[string]any{
				"status":  "failed",
				"attempt": float64(3),
				"labels":  []any{"release", "production"},
			},
		},
		Query: map[string][]string{"branch": {"main", "release"}},
		Headers: map[string][]string{
			"X-Event-Type": {"pipeline"},
		},
	}
	rules := []FilterRule{
		{Source: FilterBody, Path: "pipeline.status", Operator: FilterEquals, ValueType: FilterString, Value: "failed"},
		{Source: FilterBody, Path: "pipeline.attempt", Operator: FilterGreaterThanOrEqual, ValueType: FilterNumber, Value: 3},
		{Source: FilterBody, Path: "pipeline.labels[1]", Operator: FilterStartsWith, ValueType: FilterString, Value: "prod"},
		{Source: FilterQuery, Path: "branch", Operator: FilterEquals, ValueType: FilterString, Value: "release"},
		{Source: FilterHeader, Path: "x-event-type", Operator: FilterEquals, ValueType: FilterString, Value: "pipeline"},
		{Source: FilterHeader, Path: "Authorization", Operator: FilterNotExists},
	}
	if err := ValidateFilters(rules); err != nil {
		t.Fatal(err)
	}
	if !MatchFilters(event, rules) {
		t.Fatal("expected all filters to match")
	}
}

func TestMatchFiltersMissingAndMultiValueSemantics(t *testing.T) {
	event := Event{Query: map[string][]string{"tag": {"one", "two"}}}
	tests := []struct {
		name string
		rule FilterRule
		want bool
	}{
		{name: "any value equals", rule: FilterRule{Source: FilterQuery, Path: "tag", Operator: FilterEquals, ValueType: FilterString, Value: "two"}, want: true},
		{name: "not equal requires every value", rule: FilterRule{Source: FilterQuery, Path: "tag", Operator: FilterNotEquals, ValueType: FilterString, Value: "two"}, want: false},
		{name: "missing does not equal", rule: FilterRule{Source: FilterQuery, Path: "missing", Operator: FilterNotEquals, ValueType: FilterString, Value: "value"}, want: false},
		{name: "missing not exists", rule: FilterRule{Source: FilterQuery, Path: "missing", Operator: FilterNotExists}, want: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := MatchFilters(event, []FilterRule{tt.rule}); got != tt.want {
				t.Fatalf("MatchFilters() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidateFiltersRejectsInvalidRules(t *testing.T) {
	for _, rule := range []FilterRule{
		{Source: FilterBody, Path: "", Operator: FilterExists},
		{Source: FilterBody, Path: "items[", Operator: FilterExists},
		{Source: FilterQuery, Path: "event", Operator: FilterEquals},
		{Source: FilterHeader, Path: "X-Event", Operator: "unknown", ValueType: FilterString, Value: "x"},
		{Source: FilterBody, Path: "status", Operator: FilterContains, ValueType: FilterNumber, Value: 2},
		{Source: FilterBody, Path: "attempt", Operator: FilterGreaterThan, ValueType: FilterString, Value: "2"},
	} {
		if err := ValidateFilters([]FilterRule{rule}); err == nil {
			t.Fatalf("expected invalid rule to fail: %+v", rule)
		}
	}
}
