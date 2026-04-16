package cmd

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/saffronjam/saffron-hive/cmd/migrate"
	"github.com/saffronjam/saffron-hive/cmd/serve"
)

// Main is the top-level entrypoint for the saffron-hive binary.
// It dispatches to the appropriate subcommand based on os.Args.
func Main() {
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: saffron-hive <serve|migrate> [args...]\n")
		os.Exit(1)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	var err error
	switch os.Args[1] {
	case "serve":
		err = serve.Run(ctx)
	case "migrate":
		if len(os.Args) < 3 {
			fmt.Fprintf(os.Stderr, "usage: saffron-hive migrate <up|down|version> [steps]\n")
			os.Exit(1)
		}
		steps := 0
		if len(os.Args) >= 4 {
			if _, scanErr := fmt.Sscanf(os.Args[3], "%d", &steps); scanErr != nil {
				fmt.Fprintf(os.Stderr, "invalid steps value: %s\n", os.Args[3])
				os.Exit(1)
			}
		}
		err = migrate.Run(ctx, os.Args[2], steps)
	default:
		fmt.Fprintf(os.Stderr, "unknown command: %s\n", os.Args[1])
		os.Exit(1)
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}
