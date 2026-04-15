.PHONY: deps lint format typecheck errcheck test web api package prepare-for-commit

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

web:
	cd web && bun run dev

api:
	go run . serve

package:
	docker build -t saffron-hive .

prepare-for-commit: deps format lint typecheck errcheck test
