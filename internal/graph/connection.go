package graph

import (
	"strings"

	"github.com/saffronjam/saffron-hive/internal/graph/model"
)

func connectionTestCode(err error) model.ConnectionTestCode {
	message := strings.ToLower(err.Error())
	switch {
	case strings.Contains(message, "auth"), strings.Contains(message, "credential"), strings.Contains(message, "unauthorized"):
		return model.ConnectionTestCodeAuthenticationFailed
	case strings.Contains(message, "timeout"), strings.Contains(message, "deadline exceeded"):
		return model.ConnectionTestCodeTimeout
	case strings.Contains(message, "tls"), strings.Contains(message, "certificate"):
		return model.ConnectionTestCodeTLSFailed
	case strings.Contains(message, "refused"), strings.Contains(message, "unreachable"), strings.Contains(message, "no such host"):
		return model.ConnectionTestCodeUnreachable
	default:
		return model.ConnectionTestCodeFailed
	}
}
