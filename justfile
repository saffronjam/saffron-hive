# Saffron Hive task runner. Run `just` to list every recipe.

set shell := ["bash", "-euo", "pipefail", "-c"]

web_dir := justfile_directory() / "web"

sqlc_version := "1.31.0"

# Point testcontainers at the rootless Podman socket when no Docker daemon is
# available. Starts podman.socket on first use. No-op when DOCKER_HOST is
# already set or /var/run/docker.sock exists.
podman_socket := '''
    if [ -z "${DOCKER_HOST:-}" ] && [ ! -S /var/run/docker.sock ] && command -v podman >/dev/null 2>&1; then
        sock="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/podman/podman.sock"
        if [ ! -S "$sock" ]; then
            systemctl --user start podman.socket
        fi
        export DOCKER_HOST="unix://$sock"
        export TESTCONTAINERS_RYUK_DISABLED=true
    fi
'''

[private]
default:
    @just --list --unsorted

[group('setup')]
[doc('Install/update Go and web dependencies')]
deps:
    go mod tidy
    cd {{ web_dir }} && bun install

[group('dev')]
[working-directory('web')]
[doc('Run the Svelte dev server on :5173, proxying the API')]
web:
    [ -d node_modules ] || bun install
    bun run dev

[group('dev')]
[doc('Run the Go API on :8080 using .env')]
api:
    set -a && . ./.env && set +a && go run . serve

[group('dev')]
[doc("Print MQTT messages for a topic, e.g. `just mqttprint 'zigbee2mqtt/#'`")]
mqttprint topic:
    go run . mqttprint '{{ topic }}'

[group('check')]
[doc('Run go vet and oxlint')]
lint:
    go vet ./...
    cd {{ web_dir }} && bunx oxlint .

[group('check')]
[doc('Format Go and web source')]
format:
    gofmt -w .
    cd {{ web_dir }} && bunx oxfmt --write src/

[group('check')]
[doc('Build Go packages and run svelte-check')]
typecheck:
    go build ./...
    cd {{ web_dir }} && bun run check

[group('check')]
[doc('Run errcheck on Go packages')]
errcheck:
    errcheck $(go list ./... | grep -v -e /internal/store/sqlite -e /internal/graph/model)

[group('check')]
[doc('Run Go race tests and web tests')]
test:
    go test ./... -race -count=1
    cd {{ web_dir }} && bun run test

[group('check')]
[doc('Run Go and browser end-to-end tests')]
e2e: e2e-go e2e-ts

[group('check')]
[doc('Run Go end-to-end tests')]
e2e-go:
    #!/usr/bin/env bash
    set -euo pipefail
    {{ podman_socket }}
    go test -tags e2e ./e2e/... -v -count=1 -timeout=60s

[group('check')]
[doc('Run browser end-to-end tests')]
e2e-ts:
    #!/usr/bin/env bash
    set -euo pipefail
    {{ podman_socket }}
    docker build -t saffron-hive-test .
    cd "{{ web_dir }}" && bun run test:e2e

[group('check')]
[doc('Run generation checks, format, lint, typecheck, errcheck, and tests')]
prepare-for-commit: deps sqlc-check gqlgen-check codegen-check format lint typecheck errcheck test

[group('codegen')]
[doc('Generate SQLite query code')]
sqlc:
    @command -v sqlc >/dev/null 2>&1 || { echo "sqlc not installed (expected v{{ sqlc_version }})"; exit 1; }
    sqlc generate

[group('codegen')]
[doc('Verify committed sqlc output')]
sqlc-check:
    #!/usr/bin/env bash
    set -euo pipefail
    command -v sqlc >/dev/null 2>&1 || { echo "sqlc not installed (expected v{{ sqlc_version }})"; exit 1; }
    tmpdir=$(mktemp -d)
    cp -R internal/store/sqlite/. "$tmpdir"/
    sqlc generate
    if ! diff -rq "$tmpdir" internal/store/sqlite >/dev/null 2>&1; then
        echo "sqlc output drift detected under internal/store/sqlite/."
        echo "Run 'just sqlc' and commit the regenerated files."
        diff -rq "$tmpdir" internal/store/sqlite || true
        rm -rf "$tmpdir"
        exit 1
    fi
    rm -rf "$tmpdir"

[group('codegen')]
[doc('Generate Go GraphQL code')]
gqlgen:
    go run github.com/99designs/gqlgen generate --config api/gqlgen.yml

[group('codegen')]
[doc('Verify committed gqlgen output')]
gqlgen-check:
    #!/usr/bin/env bash
    set -euo pipefail
    tmpdir=$(mktemp -d)
    cp -R internal/graph/. "$tmpdir"/
    go run github.com/99designs/gqlgen generate --config api/gqlgen.yml
    if ! diff -rq "$tmpdir" internal/graph >/dev/null 2>&1; then
        echo "gqlgen output drift detected under internal/graph/."
        echo "Run 'just gqlgen' and commit the regenerated files."
        diff -rq "$tmpdir" internal/graph || true
        rm -rf "$tmpdir"
        exit 1
    fi
    rm -rf "$tmpdir"

[group('codegen')]
[working-directory('web')]
[doc('Generate frontend GraphQL types')]
codegen:
    bun run codegen

[group('codegen')]
[doc('Verify committed frontend GraphQL types')]
codegen-check:
    #!/usr/bin/env bash
    set -euo pipefail
    tmpdir=$(mktemp -d)
    cp -R web/src/lib/gql/. "$tmpdir"/
    cd web && bun run codegen && cd ..
    if ! diff -rq "$tmpdir" web/src/lib/gql >/dev/null 2>&1; then
        echo "graphql-codegen output drift detected under web/src/lib/gql/."
        echo "Run 'just codegen' and commit the regenerated files."
        diff -rq "$tmpdir" web/src/lib/gql || true
        rm -rf "$tmpdir"
        exit 1
    fi
    rm -rf "$tmpdir"

[group('db')]
[doc('Run pending migrations (all, or N with `just migrate-up 1`)')]
migrate-up n="":
    go run . migrate up {{ n }}

[group('db')]
[doc('Roll back N migrations')]
migrate-down n="1":
    go run . migrate down {{ n }}

[group('db')]
[doc('Print migration version')]
migrate-version:
    go run . migrate version

[group('build')]
[doc('Build the Docker image tagged with the current version')]
package:
    #!/usr/bin/env bash
    set -euo pipefail
    version=$(git describe --tags --always --dirty 2>/dev/null || echo localbuild)
    echo "Building saffron-hive:$version"
    docker build --build-arg HIVE_VERSION="$version" -t "saffron-hive:$version" -t saffron-hive:latest .
