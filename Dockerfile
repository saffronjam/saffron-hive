FROM oven/bun:latest AS frontend
WORKDIR /app/web
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile
COPY web/ ./
ARG HIVE_VERSION=localbuild
ENV HIVE_VERSION=$HIVE_VERSION
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
ARG HIVE_VERSION=localbuild
RUN CGO_ENABLED=1 go build -ldflags "-X github.com/saffronjam/saffron-hive/internal/version.Version=${HIVE_VERSION}" -o saffron-hive .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates bash curl libgcc libstdc++ ripgrep
ARG CLAUDE_VERSION=2.1.296
RUN curl -fsSL https://claude.ai/install.sh -o /tmp/install-claude.sh \
    && bash /tmp/install-claude.sh "$CLAUDE_VERSION" \
    && cp -L /root/.local/bin/claude /usr/local/bin/claude \
    && rm -rf /root/.local /root/.claude /tmp/install-claude.sh
ENV DISABLE_AUTOUPDATER=1
COPY --from=backend --chmod=755 /app/saffron-hive /usr/local/bin/saffron-hive
ENTRYPOINT ["saffron-hive"]
