package serve

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/adapter/zigbee"
	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/config"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/graph"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
	_ "modernc.org/sqlite"
)

//go:embed placeholder
var webDist embed.FS

// Run starts the Saffron Hive application. It blocks until ctx is cancelled,
// then performs graceful shutdown.
func Run(ctx context.Context) error {
	cfg := config.Parse()

	levelVar, logBuffer := logging.Setup(slog.LevelInfo)

	db, err := sql.Open("sqlite", cfg.DBPath+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		return err
	}
	defer func() { _ = db.Close() }()

	sqlStore := store.New(db)

	if err := seedMQTTConfig(ctx, cfg, sqlStore); err != nil {
		return err
	}

	mqttCfg, err := sqlStore.GetMQTTConfig(ctx)
	if err != nil {
		return fmt.Errorf("failed to read mqtt config: %w", err)
	}
	if mqttCfg == nil {
		return fmt.Errorf("no MQTT configuration found: set HIVE_MQTT_BROKER or configure via the settings page")
	}

	if setting, err := sqlStore.GetSetting(ctx, "log_level"); err == nil {
		if lvl, ok := logging.ParseLevel(setting.Value); ok {
			levelVar.Set(lvl)
		}
	}

	bus := eventbus.NewChannelBus()

	memStore := device.NewMemoryStore()
	memStore.RunAsync(ctx, bus)

	dbDevices, err := sqlStore.ListDevices(ctx)
	if err != nil {
		slog.Error("failed to load devices from db", "error", err)
	} else {
		for _, d := range dbDevices {
			d.Available = false
			memStore.Register(d)
		}
		if len(dbDevices) > 0 {
			slog.Info("hydrated devices from database", "count", len(dbDevices))
		}
	}

	mgr := &adapterManager{
		store:    sqlStore,
		bus:      bus,
		memStore: memStore,
	}

	mgr.client = zigbee.NewPahoClient(zigbee.PahoConfig{
		Broker:   mqttCfg.Broker,
		Username: mqttCfg.Username,
		Password: mqttCfg.Password,
		UseWSS:   mqttCfg.UseWSS,
		ClientID: "saffron-hive",
	})

	sensorCh := bus.Subscribe(eventbus.EventDeviceStateChanged)
	deviceCh := bus.Subscribe(
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
	)
	go runSensorRecorder(ctx, bus, sensorCh, sqlStore)
	go runDevicePersister(ctx, bus, deviceCh, sqlStore)

	mgr.adapter = zigbee.NewZigbeeAdapter(mgr.client, bus, memStore, memStore)
	if err := mgr.adapter.Start(); err != nil {
		return err
	}
	defer mgr.Stop()

	engine := automation.NewEngine(bus, memStore, sqlStore, sqlStore)
	go func() {
		if err := engine.Run(ctx); err != nil && ctx.Err() == nil {
			slog.Error("automation engine error", "error", err)
		}
	}()

	resolver := &graph.Resolver{
		StateReader:        memStore,
		Store:              sqlStore,
		TargetResolver:     sqlStore,
		EventBus:           bus,
		AutomationReloader: &engineReloader{engine: engine, ctx: ctx},
		LogBuffer:          logBuffer,
		LevelVar:           levelVar,
		Reconnector:        mgr,
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

	slog.Info("listening", "addr", cfg.ListenAddr)
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		return err
	}
	return nil
}

func seedMQTTConfig(ctx context.Context, cfg config.Config, s store.Store) error {
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
	slog.Info("seeding MQTT config from environment variables")
	return s.UpsertMQTTConfig(ctx, store.MQTTConfig{
		Broker:   cfg.MQTTBroker,
		Username: cfg.MQTTUsername,
		Password: cfg.MQTTPassword,
		UseWSS:   cfg.MQTTUseWSS,
	})
}

type adapterManager struct {
	mu       sync.Mutex
	client   zigbee.MQTTClient
	adapter  *zigbee.ZigbeeAdapter
	store    store.Store
	bus      eventbus.EventBus
	memStore *device.MemoryStore
}

// Stop shuts down the current adapter.
func (m *adapterManager) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.adapter != nil {
		m.adapter.Stop()
	}
}

// Reconnect stops the current MQTT adapter, reads new config from the
// database, and starts a fresh connection.
func (m *adapterManager) Reconnect(ctx context.Context) error {
	mqttCfg, err := m.store.GetMQTTConfig(ctx)
	if err != nil {
		return fmt.Errorf("read mqtt config: %w", err)
	}
	if mqttCfg == nil {
		return fmt.Errorf("no MQTT configuration in database")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	m.adapter.Stop()

	m.client = zigbee.NewPahoClient(zigbee.PahoConfig{
		Broker:   mqttCfg.Broker,
		Username: mqttCfg.Username,
		Password: mqttCfg.Password,
		UseWSS:   mqttCfg.UseWSS,
		ClientID: "saffron-hive",
	})

	m.adapter = zigbee.NewZigbeeAdapter(m.client, m.bus, m.memStore, m.memStore)
	if err := m.adapter.Start(); err != nil {
		return fmt.Errorf("start adapter with new config: %w", err)
	}

	slog.Info("MQTT reconnected with new configuration", "broker", mqttCfg.Broker)
	return nil
}

type engineReloader struct {
	engine *automation.Engine
	ctx    context.Context
}

func (r *engineReloader) Reload() error {
	return r.engine.Reload(r.ctx)
}

func runSensorRecorder(ctx context.Context, bus eventbus.EventBus, ch <-chan eventbus.Event, s store.Store) {
	defer bus.Unsubscribe(ch)

	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-ch:
			if !ok {
				return
			}
			ss, ok := evt.Payload.(device.SensorState)
			if !ok {
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
				slog.Error("failed to insert sensor reading", "pkg", "sensor_recorder", "device_id", evt.DeviceID, "error", err)
			}
		}
	}
}

func runDevicePersister(ctx context.Context, bus eventbus.EventBus, ch <-chan eventbus.Event, s store.Store) {
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
					slog.Error("failed to upsert device", "pkg", "device_persister", "device_id", d.ID, "error", err)
					continue
				}
				if d.Source == "zigbee" {
					err = s.UpsertZigbeeDevice(ctx, store.RegisterZigbeeDeviceParams{
						DeviceID:     d.ID,
						IEEEAddress:  string(d.ID),
						FriendlyName: d.Name,
					})
					if err != nil {
						slog.Error("failed to upsert zigbee device", "pkg", "device_persister", "device_id", d.ID, "error", err)
					}
				}

			case eventbus.EventDeviceRemoved:
				id := device.DeviceID(evt.DeviceID)
				_, err := s.UpdateDevice(ctx, store.UpdateDeviceParams{
					ID:      id,
					Removed: true,
				})
				if err != nil {
					slog.Error("failed to mark device removed", "pkg", "device_persister", "device_id", evt.DeviceID, "error", err)
				}
			}
		}
	}
}
