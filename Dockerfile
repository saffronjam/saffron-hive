FROM oven/bun:latest AS frontend
WORKDIR /app/web
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile
COPY web/ ./
RUN bun run build

FROM golang:1.26-alpine AS backend
RUN apk add --no-cache gcc musl-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Overlay the built Svelte bundle on top of the dev placeholder so `go:embed`
# ships the real frontend in the binary. Uses `/.` so directory contents (not
# the web/build dir itself) merge into cmd/serve/webdist/.
COPY --from=frontend /app/web/build/. ./cmd/serve/webdist/
RUN CGO_ENABLED=1 go build -o saffron-hive .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=backend --chmod=755 /app/saffron-hive /usr/local/bin/saffron-hive
ENTRYPOINT ["saffron-hive"]
