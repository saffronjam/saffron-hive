package webhook

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"strings"
	"unicode"
)

// FilterSource selects the transient request data a rule inspects.
type FilterSource string

const (
	FilterBody   FilterSource = "body"
	FilterQuery  FilterSource = "query"
	FilterHeader FilterSource = "header"
)

// FilterOperator controls how a resolved value is compared.
type FilterOperator string

const (
	FilterExists             FilterOperator = "exists"
	FilterNotExists          FilterOperator = "not_exists"
	FilterEquals             FilterOperator = "equals"
	FilterNotEquals          FilterOperator = "not_equals"
	FilterContains           FilterOperator = "contains"
	FilterStartsWith         FilterOperator = "starts_with"
	FilterEndsWith           FilterOperator = "ends_with"
	FilterGreaterThan        FilterOperator = "greater_than"
	FilterGreaterThanOrEqual FilterOperator = "greater_than_or_equal"
	FilterLessThan           FilterOperator = "less_than"
	FilterLessThanOrEqual    FilterOperator = "less_than_or_equal"
)

// FilterValueType defines the explicit comparison type selected by the user.
type FilterValueType string

const (
	FilterString  FilterValueType = "string"
	FilterNumber  FilterValueType = "number"
	FilterBoolean FilterValueType = "boolean"
	FilterNull    FilterValueType = "null"
)

// FilterRule is one visual incoming-webhook predicate. Rules on a trigger are
// combined with AND.
type FilterRule struct {
	Source    FilterSource    `json:"source"`
	Path      string          `json:"path"`
	Operator  FilterOperator  `json:"operator"`
	ValueType FilterValueType `json:"value_type,omitempty"`
	Value     any             `json:"value,omitempty"`
}

// ValidateFilters validates a trigger's visual webhook rules.
func ValidateFilters(rules []FilterRule) error {
	for i, rule := range rules {
		if rule.Source != FilterBody && rule.Source != FilterQuery && rule.Source != FilterHeader {
			return fmt.Errorf("filter %d has unknown source %q", i+1, rule.Source)
		}
		if strings.TrimSpace(rule.Path) == "" {
			return fmt.Errorf("filter %d path is required", i+1)
		}
		if _, err := parsePath(rule.Path); err != nil && rule.Source == FilterBody {
			return fmt.Errorf("filter %d path: %w", i+1, err)
		}
		switch rule.Operator {
		case FilterExists, FilterNotExists:
			continue
		case FilterEquals, FilterNotEquals, FilterContains, FilterStartsWith, FilterEndsWith,
			FilterGreaterThan, FilterGreaterThanOrEqual, FilterLessThan, FilterLessThanOrEqual:
		default:
			return fmt.Errorf("filter %d has unknown operator %q", i+1, rule.Operator)
		}
		if _, err := comparisonValue(rule); err != nil {
			return fmt.Errorf("filter %d: %w", i+1, err)
		}
		if (rule.Operator == FilterContains || rule.Operator == FilterStartsWith || rule.Operator == FilterEndsWith) && rule.ValueType != FilterString {
			return fmt.Errorf("filter %d: text operator requires a string value", i+1)
		}
		if (rule.Operator == FilterGreaterThan || rule.Operator == FilterGreaterThanOrEqual || rule.Operator == FilterLessThan || rule.Operator == FilterLessThanOrEqual) && rule.ValueType != FilterNumber {
			return fmt.Errorf("filter %d: numeric operator requires a number value", i+1)
		}
	}
	return nil
}

// MatchFilters reports whether every rule matches the incoming event.
func MatchFilters(event Event, rules []FilterRule) bool {
	for _, rule := range rules {
		values, exists := resolveRuleValues(event, rule)
		if rule.Operator == FilterExists {
			if !exists {
				return false
			}
			continue
		}
		if rule.Operator == FilterNotExists {
			if exists {
				return false
			}
			continue
		}
		if !exists {
			return false
		}
		matched := false
		for _, value := range values {
			if compareRuleValue(value, rule) {
				matched = true
				break
			}
		}
		if rule.Operator == FilterNotEquals {
			matched = true
			for _, value := range values {
				if compareEqual(value, rule) {
					matched = false
					break
				}
			}
		}
		if !matched {
			return false
		}
	}
	return true
}

func resolveRuleValues(event Event, rule FilterRule) ([]any, bool) {
	switch rule.Source {
	case FilterQuery:
		values, ok := event.Query[rule.Path]
		return stringsToAny(values), ok
	case FilterHeader:
		for name, values := range event.Headers {
			if strings.EqualFold(name, rule.Path) {
				return stringsToAny(values), true
			}
		}
		return nil, false
	case FilterBody:
		segments, err := parsePath(rule.Path)
		if err != nil {
			return nil, false
		}
		value, ok := resolvePath(event.Body, segments)
		if !ok {
			return nil, false
		}
		if list, ok := value.([]any); ok {
			return list, true
		}
		return []any{value}, true
	default:
		return nil, false
	}
}

func compareRuleValue(actual any, rule FilterRule) bool {
	if rule.Operator == FilterNotEquals {
		return !compareEqual(actual, rule)
	}
	if rule.Operator == FilterEquals {
		return compareEqual(actual, rule)
	}
	expected, err := comparisonValue(rule)
	if err != nil {
		return false
	}
	switch rule.Operator {
	case FilterContains, FilterStartsWith, FilterEndsWith:
		actualString, ok := toString(actual)
		if !ok {
			return false
		}
		expectedString, ok := expected.(string)
		if !ok {
			return false
		}
		switch rule.Operator {
		case FilterContains:
			return strings.Contains(actualString, expectedString)
		case FilterStartsWith:
			return strings.HasPrefix(actualString, expectedString)
		case FilterEndsWith:
			return strings.HasSuffix(actualString, expectedString)
		}
	case FilterGreaterThan, FilterGreaterThanOrEqual, FilterLessThan, FilterLessThanOrEqual:
		actualNumber, ok := toNumber(actual)
		if !ok {
			return false
		}
		expectedNumber, ok := expected.(float64)
		if !ok {
			return false
		}
		switch rule.Operator {
		case FilterGreaterThan:
			return actualNumber > expectedNumber
		case FilterGreaterThanOrEqual:
			return actualNumber >= expectedNumber
		case FilterLessThan:
			return actualNumber < expectedNumber
		case FilterLessThanOrEqual:
			return actualNumber <= expectedNumber
		}
	}
	return false
}

func compareEqual(actual any, rule FilterRule) bool {
	expected, err := comparisonValue(rule)
	if err != nil {
		return false
	}
	switch rule.ValueType {
	case FilterString:
		value, ok := toString(actual)
		return ok && value == expected
	case FilterNumber:
		value, ok := toNumber(actual)
		return ok && value == expected
	case FilterBoolean:
		value, ok := toBool(actual)
		return ok && value == expected
	case FilterNull:
		return actual == nil
	default:
		return reflect.DeepEqual(actual, expected)
	}
}

func comparisonValue(rule FilterRule) (any, error) {
	switch rule.ValueType {
	case FilterString:
		value, ok := toString(rule.Value)
		if !ok {
			return nil, fmt.Errorf("value must be a string")
		}
		return value, nil
	case FilterNumber:
		value, ok := toNumber(rule.Value)
		if !ok {
			return nil, fmt.Errorf("value must be a number")
		}
		return value, nil
	case FilterBoolean:
		value, ok := toBool(rule.Value)
		if !ok {
			return nil, fmt.Errorf("value must be a boolean")
		}
		return value, nil
	case FilterNull:
		return nil, nil
	default:
		return nil, fmt.Errorf("value type is required")
	}
}

type pathSegment struct {
	key   *string
	index *int
}

func parsePath(path string) ([]pathSegment, error) {
	var segments []pathSegment
	for i := 0; i < len(path); {
		if path[i] == '.' {
			i++
			continue
		}
		if path[i] == '[' {
			i++
			if i >= len(path) {
				return nil, fmt.Errorf("unterminated bracket")
			}
			if path[i] == '"' || path[i] == '\'' {
				quote := path[i]
				i++
				start := i
				for i < len(path) && path[i] != quote {
					i++
				}
				if i >= len(path) {
					return nil, fmt.Errorf("unterminated quoted key")
				}
				key := path[start:i]
				i++
				if i >= len(path) || path[i] != ']' {
					return nil, fmt.Errorf("expected closing bracket")
				}
				i++
				segments = append(segments, pathSegment{key: &key})
				continue
			}
			start := i
			for i < len(path) && unicode.IsDigit(rune(path[i])) {
				i++
			}
			if start == i || i >= len(path) || path[i] != ']' {
				return nil, fmt.Errorf("invalid array index")
			}
			index, _ := strconv.Atoi(path[start:i])
			i++
			segments = append(segments, pathSegment{index: &index})
			continue
		}
		start := i
		for i < len(path) && path[i] != '.' && path[i] != '[' {
			i++
		}
		key := strings.TrimSpace(path[start:i])
		if key == "" {
			return nil, fmt.Errorf("empty path segment")
		}
		segments = append(segments, pathSegment{key: &key})
	}
	if len(segments) == 0 {
		return nil, fmt.Errorf("path is required")
	}
	return segments, nil
}

func resolvePath(root any, segments []pathSegment) (any, bool) {
	current := root
	for _, segment := range segments {
		if segment.key != nil {
			object, ok := current.(map[string]any)
			if !ok {
				return nil, false
			}
			current, ok = object[*segment.key]
			if !ok {
				return nil, false
			}
			continue
		}
		list, ok := current.([]any)
		if !ok || segment.index == nil || *segment.index < 0 || *segment.index >= len(list) {
			return nil, false
		}
		current = list[*segment.index]
	}
	return current, true
}

func stringsToAny(values []string) []any {
	result := make([]any, len(values))
	for i, value := range values {
		result[i] = value
	}
	return result
}

func toString(value any) (string, bool) {
	stringValue, ok := value.(string)
	return stringValue, ok
}

func toNumber(value any) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case json.Number:
		n, err := v.Float64()
		return n, err == nil
	case string:
		n, err := strconv.ParseFloat(v, 64)
		return n, err == nil
	default:
		return 0, false
	}
}

func toBool(value any) (bool, bool) {
	switch v := value.(type) {
	case bool:
		return v, true
	case string:
		parsed, err := strconv.ParseBool(v)
		return parsed, err == nil
	default:
		return false, false
	}
}
