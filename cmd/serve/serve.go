package serve

import (
	"context"
	"database/sql"
	"embed"
	"io/fs"
	"log"
	"net"
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/adapter/zigbee"
	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/config"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/graph"
	"github.com/saffronjam/saffron-hive/internal/store"
	_ "modernc.org/sqlite"
)

//go:embed placeholder
var webDist embed.FS

// Run starts the Saffron Hive application. It blocks until ctx is cancelled,
// then performs graceful shutdown.
func Run(ctx context.Context) error {
	cfg, err := config.Parse()
	if err != nil {
		return err
	}

	db, err := sql.Open("sqlite", cfg.DBPath)
	if err != nil {
		return err
	}
	defer func() { _ = db.Close() }()

	bus := eventbus.NewChannelBus()

	memStore := device.NewMemoryStore()
	memStore.RunAsync(ctx, bus)

	sqlStore := store.New(db)

	mqttClient := zigbee.NewPahoClient(zigbee.PahoConfig{
		Broker:   cfg.MQTTBroker,
		Username: cfg.MQTTUsername,
		Password: cfg.MQTTPassword,
		UseWSS:   cfg.MQTTUseWSS,
		ClientID: "saffron-hive",
	})

	adapter := zigbee.NewZigbeeAdapter(mqttClient, bus, memStore, memStore)
	if err := adapter.Start(); err != nil {
		return err
	}
	defer adapter.Stop()

	engine := automation.NewEngine(bus, memStore, sqlStore)
	go func() {
		if err := engine.Run(ctx); err != nil && ctx.Err() == nil {
			log.Printf("automation engine error: %v", err)
		}
	}()

	resolver := &graph.Resolver{
		StateReader:        memStore,
		Store:              sqlStore,
		EventBus:           bus,
		AutomationReloader: &engineReloader{engine: engine, ctx: ctx},
	}

	gqlSrv := handler.New(graph.NewExecutableSchema(graph.Config{
		Resolvers: resolver,
	}))
	gqlSrv.AddTransport(transport.GET{})
	gqlSrv.AddTransport(transport.POST{})
	gqlSrv.AddTransport(transport.Websocket{})

	mux := http.NewServeMux()
	mux.Handle("/graphql", gqlSrv)
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	staticFS, err := fs.Sub(webDist, "placeholder")
	if err != nil {
		return err
	}
	mux.Handle("/", http.FileServerFS(staticFS))

	srv := &http.Server{
		Addr:    cfg.ListenAddr,
		Handler: mux,
		BaseContext: func(_ net.Listener) context.Context {
			return ctx
		},
	}

	go func() {
		<-ctx.Done()
		_ = srv.Shutdown(context.Background())
	}()

	log.Printf("listening on %s", cfg.ListenAddr)
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		return err
	}
	return nil
}

type engineReloader struct {
	engine *automation.Engine
	ctx    context.Context
}

func (r *engineReloader) Reload() error {
	return r.engine.Reload(r.ctx)
}
