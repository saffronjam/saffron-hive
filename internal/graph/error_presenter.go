package graph

import (
	"context"
	"regexp"
	"strconv"
	"strings"

	"github.com/99designs/gqlgen/graphql"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

var retryDurationPattern = regexp.MustCompile(`(?i)try again in ([0-9]+)s`)

// ErrorPresenter exposes stable semantic codes and keeps diagnostic prose in logs.
func ErrorPresenter(ctx context.Context, err error) *gqlerror.Error {
	presented := graphql.DefaultErrorPresenter(ctx, err)
	code, _ := presented.Extensions["code"].(string)
	arguments := map[string]any{}
	if code == "" {
		message := strings.ToLower(presented.Message)
		switch {
		case strings.Contains(message, "too many login attempts"):
			code = "RATE_LIMITED"
			if match := retryDurationPattern.FindStringSubmatch(message); len(match) == 2 {
				if seconds, parseErr := strconv.Atoi(match[1]); parseErr == nil {
					arguments["seconds"] = seconds
				}
			}
		case strings.Contains(message, "invalid username or password"):
			code = "AUTHENTICATION_FAILED"
		case strings.Contains(message, "invalid bootstrap token"):
			code = "INVALID_BOOTSTRAP_TOKEN"
		case strings.Contains(message, "not found"), strings.Contains(message, "does not exist"):
			code = "NOT_FOUND"
		case strings.Contains(message, "already exists"), strings.Contains(message, "unique constraint"):
			code = "CONFLICT"
		case strings.Contains(message, "invalid"), strings.Contains(message, "required"), strings.Contains(message, "must "):
			code = "VALIDATION_FAILED"
		default:
			code = "INTERNAL"
		}
	}
	if code == "INTERNAL" {
		graphLogger.Error("GraphQL request failed", "error", presented.Message)
	}
	extensions := map[string]any{"code": code}
	if len(arguments) > 0 {
		extensions["arguments"] = arguments
	}
	return &gqlerror.Error{
		Message:    "request failed",
		Path:       presented.Path,
		Extensions: extensions,
	}
}
