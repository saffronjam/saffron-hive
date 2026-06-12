.PHONY: help deps lint format typecheck errcheck test e2e e2e-go web api migrate-up migrate-up-n migrate-down-n migrate-version mqttprint package sqlc sqlc-check codegen codegen-check gqlgen gqlgen-check prepare-for-commit

SQLC_VERSION := 1.31.0

help:
	@printf '%s\n' 'Saffron Hive make targets'
	@printf '%s\n' ''
	@printf '%s\n' 'Setup:'
	@printf '  %-22s %s\n' 'deps' 'Install/update Go and web dependencies'
	@printf '%s\n' ''
	@printf '%s\n' 'Development:'
	@printf '  %-22s %s\n' 'web' 'Run the Svelte dev server'
	@printf '  %-22s %s\n' 'api' 'Run the Go API using .env'
	@printf '  %-22s %s\n' 'mqttprint TOPIC=...' 'Print MQTT messages for a topic'
	@printf '%s\n' ''
	@printf '%s\n' 'Checks:'
	@printf '  %-22s %s\n' 'lint' 'Run go vet and oxlint'
	@printf '  %-22s %s\n' 'format' 'Format Go and web source'
	@printf '  %-22s %s\n' 'typecheck' 'Build Go packages and run svelte-check'
	@printf '  %-22s %s\n' 'errcheck' 'Run errcheck on Go packages'
	@printf '  %-22s %s\n' 'test' 'Run Go race tests and web tests'
	@printf '  %-22s %s\n' 'e2e' 'Run Go and browser end-to-end tests'
	@printf '  %-22s %s\n' 'e2e-go' 'Run Go end-to-end tests'
	@printf '  %-22s %s\n' 'e2e-ts' 'Run browser end-to-end tests'
	@printf '%s\n' ''
	@printf '%s\n' 'Code generation:'
	@printf '  %-22s %s\n' 'sqlc' 'Generate SQLite query code'
	@printf '  %-22s %s\n' 'sqlc-check' 'Verify committed sqlc output'
	@printf '  %-22s %s\n' 'gqlgen' 'Generate Go GraphQL code'
	@printf '  %-22s %s\n' 'gqlgen-check' 'Verify committed gqlgen output'
	@printf '  %-22s %s\n' 'codegen' 'Generate frontend GraphQL types'
	@printf '  %-22s %s\n' 'codegen-check' 'Verify committed frontend GraphQL types'
	@printf '%s\n' ''
	@printf '%s\n' 'Database:'
	@printf '  %-22s %s\n' 'migrate-up' 'Run all pending migrations'
	@printf '  %-22s %s\n' 'migrate-up-n N=1' 'Run N migrations up'
	@printf '  %-22s %s\n' 'migrate-down-n N=1' 'Run N migrations down'
	@printf '  %-22s %s\n' 'migrate-version' 'Print migration version'
	@printf '%s\n' ''
	@printf '%s\n' 'Release:'
	@printf '  %-22s %s\n' 'package' 'Build Docker image'
	@printf '  %-22s %s\n' 'prepare-for-commit' 'Run generation checks, format, lint, typecheck, errcheck, and tests'

deps:
	go mod tidy
	cd web && bun install

lint:
	go vet ./...
	cd web && bunx oxlint .

format:
	gofmt -w .
	cd web && bunx oxfmt --write src/

typecheck:
	go build ./...
	cd web && bun run check

errcheck:
	errcheck $(shell go list ./... | grep -v -e /internal/store/sqlite -e /internal/graph/model)

test:
	go test ./... -race -count=1
	cd web && bun run test

web: web/node_modules
	cd web && bun run dev

web/node_modules:
	cd web && bun install

api:
	set -a && . ./.env && set +a && go run . serve

migrate-up:
	go run . migrate up

migrate-up-n:
	go run . migrate up $(N)

migrate-down-n:
	go run . migrate down $(N)

migrate-version:
	go run . migrate version

mqttprint:
	set -a && . ./.env && set +a && go run ./cmd/mqttprint $(TOPIC)

package:
	@version=$$(git describe --tags --always --dirty 2>/dev/null || echo localbuild); \
	echo "Building saffron-hive:$$version"; \
	docker build --build-arg HIVE_VERSION=$$version -t saffron-hive:$$version -t saffron-hive:latest .

sqlc:
	@command -v sqlc >/dev/null 2>&1 || { echo "sqlc not installed (expected v$(SQLC_VERSION))"; exit 1; }
	sqlc generate

sqlc-check:
	@command -v sqlc >/dev/null 2>&1 || { echo "sqlc not installed (expected v$(SQLC_VERSION))"; exit 1; }
	@tmpdir=$$(mktemp -d); \
	cp -R internal/store/sqlite/. $$tmpdir/; \
	sqlc generate; \
	if ! diff -rq $$tmpdir internal/store/sqlite >/dev/null 2>&1; then \
		echo "sqlc output drift detected under internal/store/sqlite/."; \
		echo "Run 'make sqlc' and commit the regenerated files."; \
		diff -rq $$tmpdir internal/store/sqlite || true; \
		rm -rf $$tmpdir; \
		exit 1; \
	fi; \
	rm -rf $$tmpdir

gqlgen:
	go run github.com/99designs/gqlgen generate --config api/gqlgen.yml

gqlgen-check:
	@tmpdir=$$(mktemp -d); \
	cp -R internal/graph/. $$tmpdir/; \
	go run github.com/99designs/gqlgen generate --config api/gqlgen.yml; \
	if ! diff -rq $$tmpdir internal/graph >/dev/null 2>&1; then \
		echo "gqlgen output drift detected under internal/graph/."; \
		echo "Run 'make gqlgen' and commit the regenerated files."; \
		diff -rq $$tmpdir internal/graph || true; \
		rm -rf $$tmpdir; \
		exit 1; \
	fi; \
	rm -rf $$tmpdir

codegen:
	cd web && bun run codegen

codegen-check:
	@tmpdir=$$(mktemp -d); \
	cp -R web/src/lib/gql/. $$tmpdir/; \
	cd web && bun run codegen; \
	cd ..; \
	if ! diff -rq $$tmpdir web/src/lib/gql >/dev/null 2>&1; then \
		echo "graphql-codegen output drift detected under web/src/lib/gql/."; \
		echo "Run 'make codegen' and commit the regenerated files."; \
		diff -rq $$tmpdir web/src/lib/gql || true; \
		rm -rf $$tmpdir; \
		exit 1; \
	fi; \
	rm -rf $$tmpdir

e2e: e2e-go e2e-ts

# Point testcontainers at the rootless Podman socket when no Docker daemon is
# available. Starts podman.socket on first use. No-op when DOCKER_HOST is
# already set or /var/run/docker.sock exists.
define PODMAN_SOCKET_SETUP
if [ -z "$$DOCKER_HOST" ] && [ ! -S /var/run/docker.sock ] && command -v podman >/dev/null 2>&1; then \
	sock="$${XDG_RUNTIME_DIR:-/run/user/$$(id -u)}/podman/podman.sock"; \
	if [ ! -S "$$sock" ]; then \
		systemctl --user start podman.socket; \
	fi; \
	export DOCKER_HOST="unix://$$sock"; \
	export TESTCONTAINERS_RYUK_DISABLED=true; \
fi
endef

e2e-go:
	@set -e; \
	$(PODMAN_SOCKET_SETUP); \
	go test -tags e2e ./e2e/... -v -count=1 -timeout=60s

e2e-ts:
	@set -e; \
	$(PODMAN_SOCKET_SETUP); \
	docker build -t saffron-hive-test .; \
	cd web && bun run test:e2e

prepare-for-commit: deps sqlc-check gqlgen-check codegen-check format lint typecheck errcheck test
