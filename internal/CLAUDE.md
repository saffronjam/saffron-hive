@AGENTS.md

### Assistant

`assistant/` owns Claude CLI invocation, per-user conversation snapshots, image
attachments, the loopback MCP server, action decisions and the bundled knowledge
base. `graph/assistant_gateway.go` mediates domain operations through the GraphQL
engine and defines their confirmation/private-input policy. Config JSON guides
are generated with `go generate ./internal/assistant`; source hashes and schema
coverage tests keep the exposed knowledge and capabilities aligned.
