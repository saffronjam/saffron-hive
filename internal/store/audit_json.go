package store

import (
	"database/sql/driver"
	"encoding/json"
	"errors"

	"github.com/saffronjam/saffron-hive/internal/audit"
	modernsqlite "modernc.org/sqlite"
)

func init() {
	modernsqlite.MustRegisterDeterministicScalarFunction("audit_json", 1, func(_ *modernsqlite.FunctionContext, args []driver.Value) (driver.Value, error) {
		text, ok := args[0].(string)
		if !ok || !json.Valid([]byte(text)) {
			return nil, errors.New("audit snapshot must be valid JSON")
		}
		return string(audit.SanitizeSnapshot(json.RawMessage(text))), nil
	})
}
