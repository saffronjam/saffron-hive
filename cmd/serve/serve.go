package serve

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/google/uuid"
	"os"

	"github.com/saffronjam/saffron-hive/internal/activity"
	"github.com/saffronjam/saffron-hive/internal/adapter/zigbee"
	"github.com/saffronjam/saffron-hive/internal/alarms"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/avatars"
	"github.com/saffronjam/saffron-hive/internal/config"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/graph"
	"github.com/saffronjam/saffron-hive/internal/history"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/scene"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/version"
	_ "modernc.org/sqlite"
)

//go:embed all:webdist
var webDist embed.FS

var (
	serveLogger           = logging.Named("serve")
	devicePersisterLogger = logging.Named("device_persister")
)

// Run starts the Saffron Hive application. It blocks until ctx is cancelled,
// then performs graceful shutdown.
func Run(ctx context.Context) error {
	cfg := config.Parse()

	levelVar, logBuffer := logging.Setup(slog.LevelInfo)

	// _txlock=immediate makes BeginTx issue BEGIN IMMEDIATE instead of the
	// default BEGIN DEFERRED. Deferred tx acquire only a read lock at the
	// start and upgrade to a write lock on first write — but SQLite returns
	// SQLITE_BUSY immediately on upgrade contention, and busy_timeout does
	// NOT retry that case. Writing the lock upfront lets busy_timeout cover
	// the full wait on concurrent writers.
	db, err := sql.Open("sqlite", cfg.DBPath+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_txlock=immediate")
	if err != nil {
		return err
	}
	defer func() { _ = db.Close() }()

	sqlStore := store.New(db)

	if err := seedMQTTConfig(ctx, cfg, sqlStore); err != nil {
		return err
	}
	if err := seedInitialUser(ctx, cfg, sqlStore); err != nil {
		return err
	}

	secret, err := auth.LoadOrInitSecret(ctx, sqlStore)
	if err != nil {
		return fmt.Errorf("load jwt secret: %w", err)
	}
	authSvc := auth.NewService(secret, auth.LoadTTL(ctx, sqlStore))

	mqttCfg, err := sqlStore.GetMQTTConfig(ctx)
	if err != nil {
		return fmt.Errorf("failed to read mqtt config: %w", err)
	}

	if setting, err := sqlStore.GetSetting(ctx, "log_level"); err == nil {
		if lvl, ok := logging.ParseLevel(setting.Value); ok {
			levelVar.Set(lvl)
		}
	}
	if cfg.LogLevel != "" {
		if lvl, ok := logging.ParseLevel(cfg.LogLevel); ok {
			levelVar.Set(lvl)
		} else {
			serveLogger.Warn("ignoring invalid HIVE_LOG_LEVEL", "value", cfg.LogLevel)
		}
	}

	bus := eventbus.NewChannelBus()

	memStore := device.NewMemoryStore()
	memStore.RunAsync(ctx, bus)

	dbDevices, err := sqlStore.ListDevices(ctx)
	if err != nil {
		serveLogger.Error("failed to load devices from db", "error", err)
	} else {
		for _, d := range dbDevices {
			d.Available = false
			memStore.Register(d)
		}
		if len(dbDevices) > 0 {
			serveLogger.Info("hydrated devices from database", "count", len(dbDevices))
		}
	}

	mgr := &adapterManager{
		store:    sqlStore,
		bus:      bus,
		memStore: memStore,
	}

	// bgWG tracks every long-running background goroutine so shutdown waits
	// for them to drain before the process exits. Without it, HTTP shutdown
	// cancels ctx and returns, and the recorder/engine/monitor goroutines
	// can be killed mid-write.
	var bgWG sync.WaitGroup
	spawn := func(name string, fn func()) {
		bgWG.Add(1)
		go func() {
			defer bgWG.Done()
			fn()
			serveLogger.Info("background goroutine exited", "name", name)
		}()
	}

	deviceCh := bus.Subscribe(
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
	)
	spawn("history.recorder", func() { history.RunRecorder(ctx, bus, sqlStore) })
	spawn("device.persister", func() { runDevicePersister(ctx, bus, deviceCh, sqlStore) })

	activityBuffer := activity.NewBuffer()
	roomCache := activity.NewRoomCache(sqlStore)
	if err := roomCache.Refresh(ctx); err != nil {
		serveLogger.Warn("initial room-cache refresh failed", "error", err)
	}
	spawn("activity.roomcache", func() { roomCache.Run(ctx, bus) })
	activityRecorder := activity.NewRecorder(bus, sqlStore, memStore, roomCache, activityBuffer)
	spawn("activity.recorder", func() { activityRecorder.Run(ctx) })
	spawn("activity.retention", func() { activity.RunRetention(ctx, sqlStore) })

	effectRunner := effect.NewRunner(bus, sqlStore, memStore, sqlStore, zigbeeTerminator{})
	if err := effectRunner.Hydrate(ctx); err != nil {
		serveLogger.Warn("effect runner hydrate failed", "error", err)
	}
	spawn("effect.runner", func() { effectRunner.Run(ctx) })

	sceneWatcher := scene.NewWatcher(bus, sqlStore, sqlStore, memStore, effectRunner)
	if err := sceneWatcher.Hydrate(ctx); err != nil {
		serveLogger.Warn("scene watcher hydrate failed", "error", err)
	}
	spawn("scene.watcher", func() { sceneWatcher.Run(ctx) })

	alarmBuffer := alarms.NewBuffer()
	alarmSvc := alarms.NewService(sqlStore, alarmBuffer)
	spawn("alarms.monitor", func() { alarms.RunMonitor(ctx, alarmSvc, memStore, mgr) })

	if mqttCfg != nil && mqttCfg.Broker != "" {
		mgr.client = zigbee.NewPahoClient(zigbee.PahoConfig{
			Broker:   mqttCfg.Broker,
			Username: mqttCfg.Username,
			Password: mqttCfg.Password,
			UseWSS:   mqttCfg.UseWSS,
			ClientID: "saffron-hive",
		})
		mgr.adapter = zigbee.NewZigbeeAdapter(mgr.client, bus, memStore, memStore)
		if err := mgr.adapter.Start(); err != nil {
			return err
		}
	} else {
		serveLogger.Warn("MQTT not configured, starting without a protocol adapter — complete /setup to connect")
	}

	engine := automation.NewEngine(bus, memStore, sqlStore, sqlStore, alarmSvc, effectRunner)
	spawn("automation.engine", func() {
		if err := engine.Run(ctx); err != nil && ctx.Err() == nil {
			serveLogger.Error("automation engine error", "error", err)
		}
	})

	avatarDir := avatars.Dir(cfg.DataDir)
	if err := os.MkdirAll(avatarDir, 0o755); err != nil {
		return fmt.Errorf("create avatar dir: %w", err)
	}

	engineAdapter := &engineReloader{engine: engine, ctx: ctx}
	resolver := &graph.Resolver{
		StateReader:         memStore,
		Store:               sqlStore,
		TargetResolver:      sqlStore,
		EventBus:            bus,
		AutomationReloader:  engineAdapter,
		AutomationTriggerer: engineAdapter,
		LogBuffer:           logBuffer,
		ActivityBuffer:      activityBuffer,
		Alarms:              alarmSvc,
		AlarmBuffer:         alarmBuffer,
		LevelVar:            levelVar,
		Reconnector:         mgr,
		EffectRunner:        effectRunner,
		Auth:                authSvc,
		AvatarDir:           avatarDir,
	}

	gqlSrv := handler.New(graph.NewExecutableSchema(graph.Config{
		Resolvers: resolver,
	}))
	gqlSrv.AddTransport(transport.GET{})
	gqlSrv.AddTransport(transport.POST{})
	gqlSrv.AddTransport(transport.Websocket{
		InitFunc: wsInitFunc(authSvc),
	})

	mux := http.NewServeMux()
	mux.Handle("/graphql", auth.Middleware(authSvc, sqlStore)(gqlSrv))
	mux.Handle("/api/avatars", auth.RequireAuth(authSvc, sqlStore)(avatars.NewUploadHandler(avatarDir, sqlStore)))
	mux.Handle("/avatars/", avatars.NewServeHandler(avatarDir))
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/version", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"version": version.Version})
	})

	staticFS, err := fs.Sub(webDist, "webdist")
	if err != nil {
		return err
	}
	mux.Handle("/", spaFallbackHandler(staticFS))

	srv := &http.Server{
		Addr:    cfg.ListenAddr,
		Handler: mux,
		BaseContext: func(_ net.Listener) context.Context {
			return ctx
		},
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			serveLogger.Warn("http server shutdown error", "error", err)
		}
	}()

	serveLogger.Info("listening", "addr", cfg.ListenAddr)
	listenErr := srv.ListenAndServe()
	if listenErr == http.ErrServerClosed {
		listenErr = nil
	}

	// Stop the MQTT adapter before waiting for goroutines so its command
	// loop (which selects on the event bus) can drain.
	mgr.Stop()

	drained := make(chan struct{})
	go func() {
		bgWG.Wait()
		close(drained)
	}()
	select {
	case <-drained:
		serveLogger.Info("all background goroutines drained")
	case <-time.After(15 * time.Second):
		serveLogger.Warn("background goroutines did not drain within 15s; exiting anyway")
	}

	return listenErr
}

// spaFallbackHandler serves static frontend assets and falls back to index.html
// for any path whose file doesn't exist — required because SvelteKit runs as an
// SPA with client-side routing (ssr=false), so URLs like /scenes must be
// rewritten to index.html and the app takes over from there.
func spaFallbackHandler(fsys fs.FS) http.Handler {
	fileServer := http.FileServerFS(fsys)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			fileServer.ServeHTTP(w, r)
			return
		}
		if _, err := fs.Stat(fsys, path); err != nil {
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/"
			fileServer.ServeHTTP(w, r2)
			return
		}
		fileServer.ServeHTTP(w, r)
	})
}

// wsInitFunc validates the authToken sent via graphql-ws connectionParams and
// attaches the user to the subscription context. Whitelisted subscriptions do
// not exist — every subscription requires authentication.
func wsInitFunc(svc *auth.Service) transport.WebsocketInitFunc {
	return func(ctx context.Context, init transport.InitPayload) (context.Context, *transport.InitPayload, error) {
		tokenAny, ok := init["authToken"]
		if !ok {
			return ctx, nil, errors.New("missing authToken")
		}
		token, ok := tokenAny.(string)
		if !ok || token == "" {
			return ctx, nil, errors.New("invalid authToken")
		}
		claims, err := svc.Parse(token)
		if err != nil {
			return ctx, nil, errors.New("invalid or expired token")
		}
		authedCtx := auth.WithUser(ctx, auth.CtxUser{
			ID:       claims.UserID,
			Username: claims.Username,
			Name:     claims.Name,
		})
		return authedCtx, nil, nil
	}
}

func seedMQTTConfig(ctx context.Context, cfg config.Config, s *store.DB) error {
	if !cfg.HasMQTTConfig() {
		return nil
	}
	existing, err := s.GetMQTTConfig(ctx)
	if err != nil {
		return fmt.Errorf("check mqtt config: %w", err)
	}
	if existing != nil {
		return nil
	}
	serveLogger.Info("seeding MQTT config from environment variables")
	return s.UpsertMQTTConfig(ctx, store.MQTTConfig{
		Broker:   cfg.MQTTAddress,
		Username: cfg.MQTTUser,
		Password: cfg.MQTTPassword,
		UseWSS:   cfg.MQTTUseWSS,
	})
}

// seedInitialUser creates the first user from HIVE_INIT_USER / HIVE_INIT_PASSWORD
// when the users table is empty. Safe to run on every startup — if any user
// exists, this is a no-op.
func seedInitialUser(ctx context.Context, cfg config.Config, s *store.DB) error {
	if !cfg.HasInitUser() {
		return nil
	}
	count, err := s.CountUsers(ctx)
	if err != nil {
		return fmt.Errorf("check users: %w", err)
	}
	if count > 0 {
		return nil
	}
	hash, err := auth.HashPassword(cfg.InitPassword)
	if err != nil {
		return fmt.Errorf("hash init password: %w", err)
	}
	_, err = s.CreateUser(ctx, store.CreateUserParams{
		ID:           uuid.New().String(),
		Username:     cfg.InitUser,
		Name:         cfg.InitUser,
		PasswordHash: hash,
	})
	if err != nil {
		return fmt.Errorf("create init user: %w", err)
	}
	serveLogger.Info("seeded initial user from environment variables", "username", cfg.InitUser)
	return nil
}

type adapterManager struct {
	mu       sync.Mutex
	client   zigbee.MQTTClient
	adapter  *zigbee.ZigbeeAdapter
	store    *store.DB
	bus      eventbus.EventBus
	memStore *device.MemoryStore
}

// MQTTConnected reports whether the managed MQTT client is currently
// connected. Returns false when no client has been configured yet (e.g.
// before /setup is complete).
func (m *adapterManager) MQTTConnected() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.client == nil {
		return false
	}
	return m.client.IsConnected()
}

// Stop shuts down the current adapter if one is running.
func (m *adapterManager) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.adapter != nil {
		m.adapter.Stop()
		m.adapter = nil
	}
}

// Reconnect stops the current MQTT adapter (if any), reads config from the
// database, and starts a fresh connection. Also serves as the first-time start
// when the app booted without an MQTT config and the user completes /setup.
func (m *adapterManager) Reconnect(ctx context.Context) error {
	mqttCfg, err := m.store.GetMQTTConfig(ctx)
	if err != nil {
		return fmt.Errorf("read mqtt config: %w", err)
	}
	if mqttCfg == nil || mqttCfg.Broker == "" {
		return fmt.Errorf("no MQTT configuration in database")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	if m.adapter != nil {
		m.adapter.Stop()
		m.adapter = nil
		m.client = nil
	}

	client := zigbee.NewPahoClient(zigbee.PahoConfig{
		Broker:   mqttCfg.Broker,
		Username: mqttCfg.Username,
		Password: mqttCfg.Password,
		UseWSS:   mqttCfg.UseWSS,
		ClientID: "saffron-hive",
	})

	adapter := zigbee.NewZigbeeAdapter(client, m.bus, m.memStore, m.memStore)
	if err := adapter.Start(); err != nil {
		// Roll back the partial construction: tear down the Paho goroutines
		// and leave the manager in a clean "not connected" state so a retry
		// doesn't try to Stop() a half-initialised adapter.
		adapter.Stop()
		return fmt.Errorf("start adapter with new config: %w", err)
	}
	m.client = client
	m.adapter = adapter

	serveLogger.Info("MQTT reconnected with new configuration", "broker", mqttCfg.Broker)
	return nil
}

// zigbeeTerminator wraps the package-level zigbee.TerminatorFor lookup so it
// can satisfy effect.NativeEffectStopper without the effect package importing
// the zigbee adapter.
type zigbeeTerminator struct{}

func (zigbeeTerminator) TerminatorFor(dev device.Device) string {
	return zigbee.TerminatorFor(dev)
}

type engineReloader struct {
	engine *automation.Engine
	ctx    context.Context
}

func (r *engineReloader) Reload() error {
	return r.engine.Reload(r.ctx)
}

func (r *engineReloader) FireManualTrigger(ctx context.Context, automationID, nodeID string) error {
	return r.engine.FireManualTrigger(ctx, automationID, automation.NodeID(nodeID))
}

func runDevicePersister(ctx context.Context, bus eventbus.EventBus, ch <-chan eventbus.Event, s *store.DB) {
	defer bus.Unsubscribe(ch)

	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-ch:
			if !ok {
				return
			}
			switch evt.Type {
			case eventbus.EventDeviceAdded:
				d, ok := evt.Payload.(device.Device)
				if !ok {
					continue
				}
				err := s.UpsertDevice(ctx, store.CreateDeviceParams{
					ID:           d.ID,
					Name:         d.Name,
					Source:       d.Source,
					Type:         d.Type,
					Capabilities: d.Capabilities,
				})
				if err != nil {
					devicePersisterLogger.Error("failed to upsert device", "device_id", d.ID, "error", err)
					continue
				}
				if d.Source == "zigbee" {
					err = s.UpsertZigbeeDevice(ctx, store.RegisterZigbeeDeviceParams{
						DeviceID:     d.ID,
						IEEEAddress:  string(d.ID),
						FriendlyName: d.Name,
					})
					if err != nil {
						devicePersisterLogger.Error("failed to upsert zigbee device", "device_id", d.ID, "error", err)
					}
				}

			case eventbus.EventDeviceRemoved:
				id := device.DeviceID(evt.DeviceID)
				_, err := s.UpdateDevice(ctx, store.UpdateDeviceParams{
					ID:      id,
					Removed: true,
				})
				if err != nil {
					devicePersisterLogger.Error("failed to mark device removed", "device_id", evt.DeviceID, "error", err)
				}
			}
		}
	}
}
