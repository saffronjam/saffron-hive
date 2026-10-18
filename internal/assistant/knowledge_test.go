package assistant

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"testing"
)

func TestKnowledgeMatchesDomainSources(t *testing.T) {
	re := regexp.MustCompile(`<!-- source: (\S+) sha256: ([a-f0-9]+) -->`)
	for _, topic := range []string{"devices", "automations", "scenes", "administration", "automation-config", "effect-config", "scene-config", "authoring-examples"} {
		doc, err := knowledge(topic)
		if err != nil || doc == "" {
			t.Fatalf("topic %s: %v", topic, err)
		}
		for _, match := range re.FindAllStringSubmatch(doc, -1) {
			raw, err := os.ReadFile(filepath.Join("../..", match[1]))
			if err != nil {
				t.Fatal(err)
			}
			if fmt.Sprintf("%x", sha256.Sum256(raw)) != match[2] {
				t.Fatalf("%s reference drifted; run go generate ./internal/assistant", topic)
			}
		}
	}
}
