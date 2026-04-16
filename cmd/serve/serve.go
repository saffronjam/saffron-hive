package serve

import (
	"context"
	"database/sql"
	"embed"
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"time"

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

	db, err := sql.Open("sqlite", cfg.DBPath+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		return err
	}
	defer func() { _ = db.Close() }()

	bus := eventbus.NewChannelBus()

	memStore := device.NewMemoryStore()
	memStore.RunAsync(ctx, bus)

	sqlStore := store.New(db)

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

	mqttClient := zigbee.NewPahoClient(zigbee.PahoConfig{
		Broker:   cfg.MQTTBroker,
		Username: cfg.MQTTUsername,
		Password: cfg.MQTTPassword,
		UseWSS:   cfg.MQTTUseWSS,
		ClientID: "saffron-hive",
	})

	sensorCh := bus.Subscribe(eventbus.EventDeviceStateChanged)
	deviceCh := bus.Subscribe(
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
	)
	go runSensorRecorder(ctx, bus, sensorCh, sqlStore)
	go runDevicePersister(ctx, bus, deviceCh, sqlStore)

	adapter := zigbee.NewZigbeeAdapter(mqttClient, bus, memStore, memStore)
	if err := adapter.Start(); err != nil {
		return err
	}
	defer adapter.Stop()

	engine := automation.NewEngine(bus, memStore, sqlStore)
	go func() {
		if err := engine.Run(ctx); err != nil && ctx.Err() == nil {
			slog.Error("automation engine error", "error", err)
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

	slog.Info("listening", "addr", cfg.ListenAddr)
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
					ID:     d.ID,
					Name:   d.Name,
					Source: d.Source,
					Type:   d.Type,
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
