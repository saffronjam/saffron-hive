.PHONY: deps lint format typecheck errcheck test web api migrate-up migrate-up-n migrate-down-n migrate-version package prepare-for-commit

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
	cd web && bun run check

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

prepare-for-commit: deps format lint typecheck errcheck test
