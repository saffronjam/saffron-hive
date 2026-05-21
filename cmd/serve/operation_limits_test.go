package serve

import (
	"strings"
	"testing"

	"github.com/99designs/gqlgen/graphql"
	"github.com/vektah/gqlparser/v2"
	"github.com/vektah/gqlparser/v2/ast"
)

const testSchemaSrc = `
type Query {
  hello: String
  me: Me
}
type Me {
  id: ID!
  name: String!
}
type Mutation {
  login(username: String!, password: String!): String
}
`

func parseDoc(t *testing.T, query string) *ast.QueryDocument {
	t.Helper()
	schema, err := gqlparser.LoadSchema(&ast.Source{Name: "test.graphql", Input: testSchemaSrc})
	if err != nil {
		t.Fatalf("load schema: %v", err)
	}
	doc, gqlErr := gqlparser.LoadQueryWithRules(schema, query, nil)
	if gqlErr != nil {
		t.Fatalf("parse query: %v", gqlErr)
	}
	return doc
}

func runExtension(t *testing.T, ext OperationLimitsExtension, query string) string {
	t.Helper()
	doc := parseDoc(t, query)
	opCtx := &graphql.OperationContext{Doc: doc}
	err := ext.MutateOperationContext(nil, opCtx)
	if err == nil {
		return ""
	}
	return err.Message
}

func TestOperationLimitsRejectsAliasFanout(t *testing.T) {
	ext := OperationLimitsExtension{
		MaxAliasesPerOperation:   5,
		MaxOperationsPerDocument: 3,
	}

	var aliases []string
	for i := 0; i < 51; i++ {
		aliases = append(aliases, "a"+itoa(i)+": hello")
	}
	query := "query { " + strings.Join(aliases, " ") + " }"

	msg := runExtension(t, ext, query)
	if msg == "" {
		t.Fatal("expected fanout rejection, got nil")
	}
	if !strings.Contains(msg, "exceeds the limit") {
		t.Errorf("unexpected error message: %q", msg)
	}
}

func TestOperationLimitsRejectsTooManyOperations(t *testing.T) {
	ext := OperationLimitsExtension{
		MaxAliasesPerOperation:   100,
		MaxOperationsPerDocument: 3,
	}

	query := `
query A { hello }
query B { hello }
query C { hello }
query D { hello }
`
	msg := runExtension(t, ext, query)
	if msg == "" {
		t.Fatal("expected operation-count rejection, got nil")
	}
	if !strings.Contains(msg, "4 operations") {
		t.Errorf("error message did not report operation count: %q", msg)
	}
}

func TestOperationLimitsAllowsSmallQueries(t *testing.T) {
	ext := OperationLimitsExtension{
		MaxAliasesPerOperation:   50,
		MaxOperationsPerDocument: 5,
	}
	if msg := runExtension(t, ext, "query { me { id name } }"); msg != "" {
		t.Errorf("legitimate query rejected: %q", msg)
	}
}

func TestOperationLimitsCountsNestedFields(t *testing.T) {
	ext := OperationLimitsExtension{
		MaxAliasesPerOperation:   2,
		MaxOperationsPerDocument: 5,
	}
	// `me` + `id` + `name` = 3 fields total; should breach a limit of 2.
	msg := runExtension(t, ext, "query { me { id name } }")
	if msg == "" {
		t.Fatal("nested field count not enforced")
	}
}

// itoa avoids a strconv import in the test file's only call site.
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	return string(b[i:])
}
