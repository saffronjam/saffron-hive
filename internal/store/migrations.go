package store

import "embed"

// Migrations contains the embedded migration SQL files.
//
//go:embed migrations/*.sql
var Migrations embed.FS
