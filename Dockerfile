FROM oven/bun:latest AS frontend
WORKDIR /app/web
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile
COPY web/ ./
RUN bun run build

FROM golang:1.23-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/web/build ./web/build
RUN CGO_ENABLED=1 go build -o saffron-hive ./cmd/

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=backend /app/saffron-hive /usr/local/bin/saffron-hive
ENTRYPOINT ["saffron-hive"]
