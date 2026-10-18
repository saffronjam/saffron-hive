package assistant

import (
	"embed"
	"fmt"
	"strings"
)

//go:generate go run ../../scripts/assistant-knowledge.go

//go:embed knowledge/*.md
var knowledgeFS embed.FS

func knowledge(topic string) (string, error) {
	if topic == "" {
		return "Topics: authoring-examples, devices, automations, automation-config, scenes, scene-config, effect-config, administration. Use discover for current GraphQL operations and types.", nil
	}
	if strings.ContainsAny(topic, "/\\.") {
		return "", fmt.Errorf("unknown knowledge topic")
	}
	b, err := knowledgeFS.ReadFile("knowledge/" + topic + ".md")
	if err != nil {
		return "", fmt.Errorf("unknown knowledge topic")
	}
	return string(b), nil
}
