package scalars

import (
	"encoding/json"
	"io"

	"github.com/99designs/gqlgen/graphql"
)

func MarshalRawJSON(value json.RawMessage) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		if len(value) == 0 {
			_, _ = io.WriteString(w, "null")
		} else {
			_, _ = w.Write(value)
		}
	})
}

func UnmarshalRawJSON(value any) (json.RawMessage, error) {
	return json.Marshal(value)
}
