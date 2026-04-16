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
COPY --from=frontend /app/web/build ./web/build
RUN CGO_ENABLED=1 go build -o saffron-hive .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=backend --chmod=755 /app/saffron-hive /usr/local/bin/saffron-hive
ENTRYPOINT ["saffron-hive"]
