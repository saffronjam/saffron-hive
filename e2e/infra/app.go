package infra

import (
	"context"
	"database/sql"
	"errors"
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
	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/activity"
	"github.com/saffronjam/saffron-hive/internal/adapter/zigbee"
	"github.com/saffronjam/saffron-hive/internal/alarms"
	"github.com/saffronjam/saffron-hive/internal/auth"
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
	// AuthToken is a pre-minted JWT for the seed user — e2e helpers use this
	// on every HTTP and WS request so the whole stack (middleware + resolver
	// auth) is exercised, not bypassed.
	AuthToken string
	UserID    string
	cancel    context.CancelFunc
	db        *sql.DB
	dbPath    string
	adapter   *zigbee.ZigbeeAdapter
	server    *http.Server
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

	db, err := sql.Open("sqlite", dbPath+"?_txlock=immediate")
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	if _, err := db.Exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;"); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("set pragmas: %w", err)
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

	alarmBuffer := alarms.NewBuffer()
	alarmSvc := alarms.NewService(sqlStore, alarmBuffer)

	activityBuffer := activity.NewBuffer()
	activityRecorder := activity.NewRecorder(bus, sqlStore, memStore, activityBuffer)
	go activityRecorder.Run(appCtx)

	engine := automation.NewEngine(bus, memStore, sqlStore, sqlStore, alarmSvc)
	go func() {
		if err := engine.Run(appCtx); err != nil && appCtx.Err() == nil {
			log.Printf("automation engine error: %v", err)
		}
	}()

	go runSensorRecorder(appCtx, bus, sqlStore)

	secret, err := auth.LoadOrInitSecret(appCtx, sqlStore)
	if err != nil {
		adapter.Stop()
		cancel()
		_ = db.Close()
		return nil, fmt.Errorf("init jwt secret: %w", err)
	}
	authSvc := auth.NewService(secret, time.Hour)

	seedUserID := uuid.New().String()
	hash, err := auth.HashPassword("e2e-password")
	if err != nil {
		adapter.Stop()
		cancel()
		_ = db.Close()
		return nil, fmt.Errorf("hash e2e password: %w", err)
	}
	if _, err := sqlStore.CreateUser(appCtx, store.CreateUserParams{
		ID:           seedUserID,
		Username:     "e2e",
		Name:         "E2E",
		PasswordHash: hash,
	}); err != nil {
		adapter.Stop()
		cancel()
		_ = db.Close()
		return nil, fmt.Errorf("create e2e user: %w", err)
	}
	token, err := authSvc.Sign(seedUserID, "e2e", "E2E")
	if err != nil {
		adapter.Stop()
		cancel()
		_ = db.Close()
		return nil, fmt.Errorf("sign e2e token: %w", err)
	}

	resolver := &graph.Resolver{
		StateReader:        memStore,
		Store:              sqlStore,
		EventBus:           bus,
		TargetResolver:     sqlStore,
		AutomationReloader: &reloader{engine: engine, ctx: appCtx},
		Alarms:             alarmSvc,
		AlarmBuffer:        alarmBuffer,
		ActivityBuffer:     activityBuffer,
		Auth:               authSvc,
	}

	gqlSrv := handler.New(graph.NewExecutableSchema(graph.Config{
		Resolvers: resolver,
	}))
	gqlSrv.AddTransport(transport.GET{})
	gqlSrv.AddTransport(transport.POST{})
	gqlSrv.AddTransport(transport.Websocket{
		InitFunc: func(ctx context.Context, init transport.InitPayload) (context.Context, *transport.InitPayload, error) {
			tok, ok := init["authToken"].(string)
			if !ok || tok == "" {
				return ctx, nil, errors.New("missing authToken")
			}
			claims, err := authSvc.Parse(tok)
			if err != nil {
				return ctx, nil, errors.New("invalid token")
			}
			return auth.WithUser(ctx, auth.CtxUser{
				ID:       claims.UserID,
				Username: claims.Username,
				Name:     claims.Name,
			}), nil, nil
		},
	})

	mux := http.NewServeMux()
	mux.Handle("/graphql", auth.Middleware(authSvc, sqlStore)(gqlSrv))
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
		AuthToken:  token,
		UserID:     seedUserID,
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

func runSensorRecorder(ctx context.Context, bus eventbus.EventBus, s *store.DB) {
	ch := bus.Subscribe(eventbus.EventDeviceStateChanged)
	defer bus.Unsubscribe(ch)

	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-ch:
			if !ok {
				return
			}
			ss, ok := evt.Payload.(device.DeviceState)
			if !ok {
				continue
			}
			if ss.Temperature == nil && ss.Humidity == nil && ss.Battery == nil && ss.Pressure == nil && ss.Illuminance == nil {
				continue
			}
			_, err := s.InsertSensorReading(ctx, store.InsertSensorReadingParams{
				DeviceID:    device.DeviceID(evt.DeviceID),
				Temperature: ss.Temperature,
				Humidity:    ss.Humidity,
				Battery:     ss.Battery,
				Pressure:    ss.Pressure,
				Illuminance: ss.Illuminance,
				RecordedAt:  time.Now(),
			})
			if err != nil {
				log.Printf("sensor recorder: failed to insert reading: %v", err)
			}
		}
	}
}
