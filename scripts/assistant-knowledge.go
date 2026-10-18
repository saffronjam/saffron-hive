//go:build ignore

// Generate the assistant's authoring reference from the public API schema.
package main

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/vektah/gqlparser/v2/ast"
	"github.com/vektah/gqlparser/v2/formatter"
	"github.com/vektah/gqlparser/v2/parser"
)

func main() {
	root := "."
	for {
		if _, err := os.Stat(filepath.Join(root, "go.mod")); err == nil {
			break
		}
		root = filepath.Join(root, "..")
		if len(root) > 100 {
			panic("repository not found")
		}
	}
	paths := []string{"api/schema.graphql", "api/authoring.graphql"}
	sources := []*ast.Source{}
	var stamps strings.Builder
	for _, path := range paths {
		raw, err := os.ReadFile(filepath.Join(root, path))
		if err != nil {
			panic(err)
		}
		sources = append(sources, &ast.Source{Name: path, Input: string(raw)})
		fmt.Fprintf(&stamps, "<!-- source: %s sha256: %x -->\n", path, sha256.Sum256(raw))
	}
	schema, err := parser.ParseSchemas(sources...)
	if err != nil {
		panic(err)
	}
	types := map[string]*ast.Definition{}
	for _, d := range schema.Definitions {
		types[d.Name] = d
	}
	topics := map[string][]string{
		"automation-config": {"CreateAutomationInput", "UpdateAutomationInput", "AutomationConfigInput", "AutomationNodePreview", "ConfigurationValidation"},
		"effect-config":     {"CreateEffectInput", "UpdateEffectInput", "EffectClipConfigInput"},
		"scene-config":      {"SceneAuthoringInput", "SceneAuthoredState", "CreateSceneInput", "UpdateSceneInput"},
	}
	for topic, roots := range topics {
		seen := map[string]bool{}
		var include func(string)
		include = func(name string) {
			d := types[name]
			if d == nil || seen[name] {
				return
			}
			seen[name] = true
			for _, field := range d.Fields {
				include(field.Type.Name())
			}
			for _, name := range d.Types {
				include(name)
			}
		}
		for _, name := range roots {
			include(name)
		}
		names := []string{}
		for name := range seen {
			names = append(names, name)
		}
		sort.Strings(names)
		subset := &ast.SchemaDocument{}
		for _, name := range names {
			subset.Definitions = append(subset.Definitions, types[name])
		}
		var body bytes.Buffer
		formatter.NewFormatter(&body).FormatSchemaDocument(subset)
		out := "# Typed authoring reference\n\nThese are GraphQL input and result types. Use discover for operation arguments and selection sets. Configuration objects contain exactly one matching variant.\n\n" + stamps.String() + "\n```graphql\n" + body.String() + "```\n"
		if err := os.WriteFile(filepath.Join(root, "internal/assistant/knowledge", topic+".md"), []byte(out), 0644); err != nil {
			panic(err)
		}
	}
}
