package infra

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/saffronjam/saffron-hive/internal/adapter/zigbee"
	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/graph"
	"github.com/saffronjam/saffron-hive/internal/store"
	_ "modernc.org/sqlite"
)

// App holds references to all running components for the e2e test.
type App struct {
	GraphQLURL string
	cancel     context.CancelFunc
	db         *sql.DB
	dbPath     string
	adapter    *zigbee.ZigbeeAdapter
	server     *http.Server
}

// StartApp starts the saffron-hive application in-process with a temp SQLite
// database, runs migrations, connects to the given MQTT broker, and starts
// the HTTP server on a random port.
func StartApp(ctx context.Context, brokerURL string) (*App, error) {
	tmpFile, err := os.CreateTemp("", "saffron-hive-e2e-*.db")
	if err != nil {
		return nil, fmt.Errorf("create temp db: %w", err)
	}
	dbPath := tmpFile.Name()
	_ = tmpFile.Close()

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	if err := runMigrations(db); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	appCtx, cancel := context.WithCancel(ctx)

	bus := eventbus.NewChannelBus()

	memStore := device.NewMemoryStore()
	memStore.RunAsync(appCtx, bus)

	sqlStore := store.New(db)

	mqttClient := zigbee.NewPahoClient(zigbee.PahoConfig{
		Broker:   brokerURL,
		ClientID: "saffron-hive-e2e",
	})

	adapter := zigbee.NewZigbeeAdapter(mqttClient, bus, memStore, memStore)
	if err := adapter.Start(); err != nil {
		cancel()
		_ = db.Close()
		return nil, fmt.Errorf("start adapter: %w", err)
	}

	engine := automation.NewEngine(bus, memStore, sqlStore)
	go func() {
		if err := engine.Run(appCtx); err != nil && appCtx.Err() == nil {
			log.Printf("automation engine error: %v", err)
		}
	}()

	resolver := &graph.Resolver{
		StateReader:        memStore,
		Store:              sqlStore,
		EventBus:           bus,
		AutomationReloader: &reloader{engine: engine, ctx: appCtx},
	}

	gqlSrv := handler.New(graph.NewExecutableSchema(graph.Config{
		Resolvers: resolver,
	}))
	gqlSrv.AddTransport(transport.GET{})
	gqlSrv.AddTransport(transport.POST{})
	gqlSrv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
	})

	mux := http.NewServeMux()
	mux.Handle("/graphql", gqlSrv)
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		adapter.Stop()
		cancel()
		_ = db.Close()
		return nil, fmt.Errorf("listen: %w", err)
	}

	srv := &http.Server{
		Handler: mux,
		BaseContext: func(_ net.Listener) context.Context {
			return appCtx
		},
	}

	go func() {
		if err := srv.Serve(listener); err != http.ErrServerClosed {
			log.Printf("http server error: %v", err)
		}
	}()

	port := listener.Addr().(*net.TCPAddr).Port
	graphqlURL := fmt.Sprintf("http://localhost:%d/graphql", port)

	return &App{
		GraphQLURL: graphqlURL,
		cancel:     cancel,
		db:         db,
		dbPath:     dbPath,
		adapter:    adapter,
		server:     srv,
	}, nil
}

// Stop shuts down the app, closes the database, and removes the temp file.
func (a *App) Stop() {
	a.adapter.Stop()
	a.cancel()
	_ = a.server.Shutdown(context.Background())
	_ = a.db.Close()
	_ = os.Remove(a.dbPath)
}

func runMigrations(db *sql.DB) error {
	sourceDriver, err := iofs.New(store.Migrations, "migrations")
	if err != nil {
		return fmt.Errorf("create migration source: %w", err)
	}

	dbDriver, err := sqlite.WithInstance(db, &sqlite.Config{})
	if err != nil {
		return fmt.Errorf("create migration db driver: %w", err)
	}

	m, err := migrate.NewWithInstance("iofs", sourceDriver, "sqlite", dbDriver)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrate up: %w", err)
	}

	return nil
}

type reloader struct {
	engine *automation.Engine
	ctx    context.Context
}

func (r *reloader) Reload() error {
	return r.engine.Reload(r.ctx)
}
