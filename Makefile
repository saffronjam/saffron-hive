.PHONY: deps lint format typecheck errcheck test e2e e2e-go web api migrate-up migrate-up-n migrate-down-n migrate-version package prepare-for-commit

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
	errcheck ./...

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

e2e: e2e-go e2e-ts

e2e-go:
	go test -tags e2e ./e2e/... -v -count=1 -timeout=60s

e2e-ts:
	docker build -t saffron-hive-test .
	cd web && bun run test:e2e

prepare-for-commit: deps format lint typecheck errcheck test
