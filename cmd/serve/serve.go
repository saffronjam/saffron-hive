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
	"path/filepath"
	"sync"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/robfig/cron/v3"
	"os"

	"github.com/saffronjam/saffron-hive/internal/activity"
	"github.com/saffronjam/saffron-hive/internal/adapter/tuya"
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
	"github.com/saffronjam/saffron-hive/internal/topology"
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

	if err := seedInitialUser(ctx, cfg, sqlStore); err != nil {
		return err
	}

	secret, err := auth.LoadOrInitSecret(ctx, sqlStore)
	if err != nil {
		return fmt.Errorf("load jwt secret: %w", err)
	}
	authSvc := auth.NewService(secret, auth.LoadTTL(ctx, sqlStore))
	loginLimiter := auth.NewLoginLimiter(auth.LoginLimiterConfig{})

	bootstrapTokenStore := NewBootstrapTokenStore(filepath.Join(cfg.DataDir, "bootstrap.token"))
	if userCount, err := sqlStore.CountUsers(ctx); err != nil {
		serveLogger.Warn("count users for bootstrap token check failed", "error", err)
	} else if userCount == 0 {
		if tok, err := bootstrapTokenStore.EnsureGenerated(); err != nil {
			serveLogger.Error("generate bootstrap token failed", "error", err)
		} else {
			serveLogger.Info("bootstrap token", "token", tok, "path", filepath.Join(cfg.DataDir, "bootstrap.token"))
		}
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
		store:        sqlStore,
		bus:          bus,
		memStore:     memStore,
		mqttClientID: cfg.MQTTClientID,
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
		eventbus.EventDeviceSynced,
		eventbus.EventDeviceRemoved,
	)
	spawn("history.recorder", func() { history.RunRecorder(ctx, bus, sqlStore) })
	spawn("device.persister", func() { runDevicePersister(ctx, bus, deviceCh, sqlStore) })
	spawn("topology.persister", func() { topology.RunPersister(ctx, bus, sqlStore) })
	spawn("auth.login_limiter", func() { loginLimiter.Run(ctx) })

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

	if err := mgr.ReconnectZigbee2MQTT(ctx); err != nil {
		serveLogger.Warn("Zigbee2MQTT integration did not start", "error", err)
	}
	if err := mgr.ReconnectTuya(ctx); err != nil {
		serveLogger.Warn("Tuya integration did not start", "error", err)
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
		Zigbee2MQTT:         mgr,
		Tuya:                mgr,
		Integrations:        mgr,
		EffectRunner:        effectRunner,
		Auth:                authSvc,
		LoginLimiter:        loginLimiter,
		BootstrapToken:      bootstrapTokenStore,
		AvatarDir:           avatarDir,
	}

	gqlSrv := handler.New(graph.NewExecutableSchema(graph.Config{
		Resolvers: resolver,
		Directives: graph.DirectiveRoot{
			Auth: graph.AuthDirective,
		},
	}))
	gqlSrv.AddTransport(transport.GET{})
	gqlSrv.AddTransport(transport.POST{})
	gqlSrv.AddTransport(transport.Websocket{
		InitFunc: wsInitFunc(authSvc, sqlStore),
		Upgrader: websocket.Upgrader{
			CheckOrigin: originChecker(cfg.AllowedOrigins),
		},
	})
	gqlSrv.Use(extension.FixedComplexityLimit(MaxQueryComplexity))
	gqlSrv.Use(OperationLimitsExtension{
		MaxAliasesPerOperation:   MaxAliasesPerOperation,
		MaxOperationsPerDocument: MaxOperationsPerDocument,
	})
	gqlSrv.SetErrorPresenter(graph.ErrorPresenter)

	mux := http.NewServeMux()
	mux.Handle("/graphql", GzipGraphQL(
		auth.ClientIPMiddleware(cfg.TrustProxyHeaders)(
			auth.RequestGuard(auth.MaxGraphQLRequestBytes)(
				auth.Middleware(authSvc, sqlStore)(gqlSrv),
			),
		),
	))
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
	staticSrv, err := newStaticHandler(staticFS)
	if err != nil {
		return err
	}
	mux.Handle("/", staticSrv)

	var indexHTML []byte
	if b, err := fs.ReadFile(staticFS, "index.html"); err == nil {
		indexHTML = b
	}
	inlineScriptHashes := computeInlineScriptHashes(indexHTML)
	if len(inlineScriptHashes) == 0 {
		serveLogger.Warn("no inline script hashes computed for CSP — strict CSP will block the SPA bootstrap")
	}

	srv := &http.Server{
		Addr:    cfg.ListenAddr,
		Handler: SecurityHeaders(inlineScriptHashes)(mux),
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

// wsInitFunc validates the authToken sent via graphql-ws connectionParams and
// attaches the user to the subscription context. Whitelisted subscriptions do
// not exist — every subscription requires authentication. The user row is
// reloaded fresh on connect so the must_change_password flag reflects current
// DB state, mirroring the HTTP middleware path.
func wsInitFunc(svc *auth.Service, lookup auth.UserLookup) transport.WebsocketInitFunc {
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
		u, err := lookup.GetUserByID(ctx, claims.UserID)
		if err != nil {
			return ctx, nil, errors.New("user not found")
		}
		if claims.TokenVersion != u.TokenVersion {
			return ctx, nil, errors.New("session revoked")
		}
		authedCtx := auth.WithUser(ctx, auth.CtxUser{
			ID:                 u.ID,
			Username:           u.Username,
			Name:               u.Name,
			MustChangePassword: u.MustChangePassword,
			TokenVersion:       u.TokenVersion,
		})
		return authedCtx, nil, nil
	}
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
	mu                 sync.Mutex
	client             zigbee.MQTTClient
	adapter            *zigbee.ZigbeeAdapter
	zigbee2mqttEnabled bool
	tuya               *tuya.Adapter
	store              *store.DB
	bus                eventbus.EventBus
	memStore           *device.MemoryStore
	mqttClientID       string
	scanStartedAt      time.Time
	scanCron           *cron.Cron
}

// scanWindow bounds how long a requested networkmap scan counts as running
// when no response has landed: past it the scan is presumed lost and a new
// one may be requested.
const scanWindow = 10 * time.Minute

// scanCronSpec renders a daily wall-clock time as a cron spec for the
// scheduled topology scan.
func scanCronSpec(hour, minute int64) string {
	return fmt.Sprintf("%d %d * * *", minute, hour)
}

// ScanZigbee2MQTTNetwork asks the running adapter for a topology scan. The
// scan itself completes asynchronously: the response lands on the bus, the
// topology persister stores it, and topology.updated announces it.
func (m *adapterManager) ScanZigbee2MQTTNetwork(ctx context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.adapter == nil {
		return fmt.Errorf("Zigbee2MQTT is not connected")
	}
	if m.scanStartedAtLocked(ctx) != nil {
		return fmt.Errorf("a network scan is already running")
	}
	if err := m.adapter.RequestNetworkmap(); err != nil {
		return err
	}
	m.scanStartedAt = time.Now()
	return nil
}

// Zigbee2MQTTScanStartedAt reports when the in-flight scan was requested, nil
// when none is running: requested within the scan window and not yet
// reflected in the stored snapshot. Computed rather than stored, so it
// survives page reloads and cannot wedge on a scan whose response never
// arrives.
func (m *adapterManager) Zigbee2MQTTScanStartedAt(ctx context.Context) *time.Time {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.scanStartedAtLocked(ctx)
}

func (m *adapterManager) scanStartedAtLocked(ctx context.Context) *time.Time {
	if m.scanStartedAt.IsZero() || time.Since(m.scanStartedAt) > scanWindow {
		return nil
	}
	topo, err := m.store.GetNetworkTopology(ctx, device.SourceZigbee2MQTT)
	if err != nil {
		serveLogger.Warn("failed to read topology for scan status", "error", err)
		return nil
	}
	if topo != nil && !topo.ScannedAt.Before(m.scanStartedAt) {
		return nil
	}
	at := m.scanStartedAt
	return &at
}

// stopScanCronLocked halts the scheduled-scan cron if one is armed. Callers
// hold m.mu; Stop does not wait for a running job, so a job blocked on the
// same mutex cannot deadlock this.
func (m *adapterManager) stopScanCronLocked() {
	if m.scanCron != nil {
		m.scanCron.Stop()
		m.scanCron = nil
	}
}

// Zigbee2MQTTConnected reports whether the managed broker client holds a live
// link. False whenever the integration is unconfigured, disabled, its adapter
// failed to start, or a reconnect is in flight — commands published during a
// reconnect are discarded, so that window is downtime the alarm monitor should
// see.
func (m *adapterManager) Zigbee2MQTTConnected() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.client == nil {
		return false
	}
	return m.client.IsConnectionOpen()
}

// Zigbee2MQTTEnabled reports whether the integration is configured and switched
// on. The alarm monitor uses this to skip the connectivity check entirely on
// installs that never added the integration.
func (m *adapterManager) Zigbee2MQTTEnabled() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.zigbee2mqttEnabled
}

// Stop shuts down the current adapter if one is running.
func (m *adapterManager) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.stopScanCronLocked()
	if m.adapter != nil {
		m.adapter.Stop()
		m.adapter = nil
	}
	if m.tuya != nil {
		m.tuya.Stop()
		m.tuya = nil
	}
}

// ReconnectZigbee2MQTT applies the persisted Zigbee2MQTT configuration: it stops
// any running adapter, then starts a fresh one when the integration is
// configured and enabled. An unconfigured or disabled integration is not an
// error; the adapter simply stays down. This is the only path through which
// persisted config reaches the manager, so zigbee2mqttEnabled cannot drift from
// the database.
func (m *adapterManager) ReconnectZigbee2MQTT(ctx context.Context) error {
	cfg, err := m.store.GetZigbee2MQTTConfig(ctx)
	if err != nil {
		return fmt.Errorf("read zigbee2mqtt config: %w", err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	if m.adapter != nil {
		m.adapter.Stop()
		m.adapter = nil
	}
	m.client = nil
	m.stopScanCronLocked()

	// Set before attempting Start so a configured integration whose broker is
	// unreachable still counts as enabled, and the connectivity alarm fires.
	m.zigbee2mqttEnabled = cfg != nil && cfg.Enabled && cfg.Broker != ""
	if !m.zigbee2mqttEnabled {
		return nil
	}

	client := zigbee.NewPahoClient(zigbee.PahoConfig{
		Broker:   cfg.Broker,
		Username: cfg.Username,
		Password: cfg.Password,
		UseWSS:   cfg.UseWSS,
		ClientID: m.mqttClientID,
	})

	adapter := zigbee.NewZigbeeAdapter(client, m.bus, m.memStore, m.memStore)
	if err := adapter.Start(); err != nil {
		// Roll back the partial construction: tear down the Paho goroutines
		// and leave the manager in a clean "not connected" state so a retry
		// doesn't try to Stop() a half-initialised adapter.
		adapter.Stop()
		return fmt.Errorf("start zigbee2mqtt adapter: %w", err)
	}
	m.client = client
	m.adapter = adapter

	if cfg.ScanScheduleEnabled && cfg.ScanHour != nil && cfg.ScanMinute != nil {
		c := cron.New()
		spec := scanCronSpec(*cfg.ScanHour, *cfg.ScanMinute)
		if _, err := c.AddFunc(spec, func() {
			if err := m.ScanZigbee2MQTTNetwork(context.Background()); err != nil {
				serveLogger.Warn("scheduled network scan skipped", "error", err)
			}
		}); err != nil {
			serveLogger.Error("failed to arm scheduled network scan", "spec", spec, "error", err)
		} else {
			c.Start()
			m.scanCron = c
			serveLogger.Info("scheduled daily network scan",
				"hour", *cfg.ScanHour, "minute", *cfg.ScanMinute)
		}
	}

	serveLogger.Info("Zigbee2MQTT connected", "broker", cfg.Broker, "client_id", m.mqttClientID)
	return nil
}

// TestZigbee2MQTT opens a throwaway broker connection with the given credentials
// and reports whether it succeeded, leaving the running adapter untouched. Its
// client ID is derived from the adapter's so the test connection displaces
// neither the adapter nor another host's test.
func (m *adapterManager) TestZigbee2MQTT(_ context.Context, cfg store.Zigbee2MQTTConfig) error {
	client := zigbee.NewPahoClient(zigbee.PahoConfig{
		Broker:   cfg.Broker,
		Username: cfg.Username,
		Password: cfg.Password,
		UseWSS:   cfg.UseWSS,
		ClientID: config.SubClientID(m.mqttClientID, "test"),
	})
	if err := client.Connect(); err != nil {
		return err
	}
	client.Disconnect(250)
	return nil
}

func (m *adapterManager) ReconnectTuya(ctx context.Context) error {
	cfg, err := m.store.GetTuyaConfig(ctx)
	if err != nil {
		return fmt.Errorf("read tuya config: %w", err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	if m.tuya != nil {
		m.tuya.Stop()
		m.tuya = nil
	}
	if cfg == nil || !cfg.Enabled || cfg.AccessID == "" || cfg.AccessSecret == "" || cfg.Region == "" {
		return nil
	}

	client, err := tuya.NewCloudClient(tuya.Config{
		AccessID:     cfg.AccessID,
		AccessSecret: cfg.AccessSecret,
		Region:       cfg.Region,
		Enabled:      cfg.Enabled,
	})
	if err != nil {
		return err
	}
	adapter := tuya.NewAdapter(client, m.bus, m.memStore, m.store)
	if err := adapter.Start(ctx); err != nil {
		adapter.Stop()
		return fmt.Errorf("start tuya adapter: %w", err)
	}
	m.tuya = adapter
	serveLogger.Info("Tuya integration connected", "region", cfg.Region)
	return nil
}

func (m *adapterManager) TestTuya(ctx context.Context, cfg store.TuyaConfig) error {
	client, err := tuya.NewCloudClient(tuya.Config{
		AccessID:     cfg.AccessID,
		AccessSecret: cfg.AccessSecret,
		Region:       cfg.Region,
		Enabled:      cfg.Enabled,
	})
	if err != nil {
		return err
	}
	return client.Test(ctx)
}

func (m *adapterManager) SyncTuya(ctx context.Context) ([]device.Device, error) {
	m.mu.Lock()
	adapter := m.tuya
	m.mu.Unlock()
	if adapter != nil {
		return adapter.Sync(ctx)
	}

	cfg, err := m.store.GetTuyaConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("read tuya config: %w", err)
	}
	if cfg == nil || !cfg.Enabled || cfg.AccessID == "" || cfg.AccessSecret == "" || cfg.Region == "" {
		return nil, errors.New("Tuya integration is not configured")
	}
	client, err := tuya.NewCloudClient(tuya.Config{
		AccessID:     cfg.AccessID,
		AccessSecret: cfg.AccessSecret,
		Region:       cfg.Region,
		Enabled:      cfg.Enabled,
	})
	if err != nil {
		return nil, err
	}
	return tuya.NewAdapter(client, m.bus, m.memStore, m.store).Sync(ctx)
}

// DeleteIntegration removes a provider's configuration and stops its adapter,
// returning the number of devices removed alongside it.
//
// Zigbee2MQTT keeps its device rows. Device ids are IEEE addresses, so
// reconfiguring the integration recovers every device onto its original row with
// its name, icon, tags, room and scene references intact; deleting them would
// instead orphan those references. Tuya purges, because its cloud ids are
// re-derived on every sync.
func (m *adapterManager) DeleteIntegration(ctx context.Context, provider string) (int, error) {
	switch device.Source(provider) {
	case device.SourceZigbee2MQTT:
		m.mu.Lock()
		if m.adapter != nil {
			m.adapter.Stop()
			m.adapter = nil
		}
		m.client = nil
		m.zigbee2mqttEnabled = false
		m.stopScanCronLocked()
		m.mu.Unlock()

		if err := m.store.DeleteZigbee2MQTTConfig(ctx); err != nil {
			return 0, err
		}
		if err := m.store.DeleteNetworkTopology(ctx, device.SourceZigbee2MQTT); err != nil {
			return 0, err
		}
		m.markSourceUnavailable(ctx, device.SourceZigbee2MQTT)
		return 0, nil

	case device.SourceTuya:
		m.mu.Lock()
		if m.tuya != nil {
			m.tuya.Stop()
			m.tuya = nil
		}
		m.mu.Unlock()

		if err := m.store.DeleteTuyaConfig(ctx); err != nil {
			return 0, err
		}
		return m.purgeDevicesForSource(ctx, device.SourceTuya)

	default:
		return 0, fmt.Errorf("unknown integration %q", provider)
	}
}

// purgeDevicesForSource deletes every device belonging to a source and reports
// how many rows went away.
func (m *adapterManager) purgeDevicesForSource(ctx context.Context, source device.Source) (int, error) {
	devices, err := m.store.ListDevicesBySource(ctx, source)
	if err != nil {
		return 0, err
	}
	for _, dev := range devices {
		if err := m.store.DeleteDevice(ctx, dev.ID); err != nil {
			return 0, err
		}
		m.memStore.Remove(dev.ID)
		m.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceRemoved,
			DeviceID:  string(dev.ID),
			Timestamp: time.Now(),
		})
	}
	return len(devices), nil
}

// markSourceUnavailable flags a source's devices offline so the dashboard stops
// showing stale online state once its adapter has stopped.
func (m *adapterManager) markSourceUnavailable(ctx context.Context, source device.Source) {
	devices, err := m.store.ListDevicesBySource(ctx, source)
	if err != nil {
		serveLogger.Warn("failed to list devices to mark unavailable", "source", source, "error", err)
		return
	}
	for _, dev := range devices {
		m.memStore.SetAvailability(dev.ID, false)
		m.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceAvailabilityChanged,
			DeviceID:  string(dev.ID),
			Timestamp: time.Now(),
			Payload:   false,
		})
	}
}

func (m *adapterManager) TuyaConnected() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.tuya != nil
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
			case eventbus.EventDeviceAdded, eventbus.EventDeviceSynced:
				d, ok := evt.Payload.(device.Device)
				if !ok {
					continue
				}
				err := s.UpsertDevice(ctx, store.CreateDeviceParams{
					ID:           d.ID,
					FriendlyName: d.FriendlyName,
					Source:       d.Source,
					Type:         d.Type,
					Capabilities: d.Capabilities,
				})
				if err != nil {
					devicePersisterLogger.Error("failed to upsert device", "device_id", d.ID, "error", err)
					continue
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
