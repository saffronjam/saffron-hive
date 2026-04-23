.PHONY: deps lint format typecheck errcheck test e2e e2e-go web api migrate-up migrate-up-n migrate-down-n migrate-version package sqlc sqlc-check codegen codegen-check prepare-for-commit

SQLC_VERSION := 1.31.0

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

package:
	docker build -t saffron-hive .

sqlc:
	@command -v sqlc >/dev/null 2>&1 || { echo "sqlc not installed (expected v$(SQLC_VERSION)). Install: brew install sqlc"; exit 1; }
	sqlc generate

sqlc-check:
	@command -v sqlc >/dev/null 2>&1 || { echo "sqlc not installed (expected v$(SQLC_VERSION)). Install: brew install sqlc"; exit 1; }
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

e2e-go:
	go test -tags e2e ./e2e/... -v -count=1 -timeout=60s

e2e-ts:
	docker build -t saffron-hive-test .
	cd web && bun run test:e2e

prepare-for-commit: deps sqlc-check codegen-check format lint typecheck errcheck test
