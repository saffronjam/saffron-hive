package infra

import (
	"context"
	"time"

	"github.com/saffronjam/saffron-hive/internal/adapter/zigbee"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// zigbeeController satisfies graph.Zigbee2MQTTController against the test
// app's always-running adapter: the connection lifecycle is fixed by the
// harness, so only the scan operations do real work.
type zigbeeController struct {
	adapter *zigbee.ZigbeeAdapter
	store   *store.DB
}

func (c *zigbeeController) ReconnectZigbee2MQTT(context.Context) error { return nil }

func (c *zigbeeController) TestZigbee2MQTT(context.Context, store.Zigbee2MQTTConfig) error {
	return nil
}

func (c *zigbeeController) Zigbee2MQTTConnected() bool { return true }

func (c *zigbeeController) Zigbee2MQTTEnabled() bool { return true }

func (c *zigbeeController) ScanZigbee2MQTTNetwork(context.Context) error {
	return c.adapter.RequestNetworkmap()
}

func (c *zigbeeController) Zigbee2MQTTScanStartedAt(ctx context.Context) *time.Time {
	topo, err := c.store.GetNetworkTopology(ctx, device.SourceZigbee2MQTT)
	if err != nil || topo != nil {
		return nil
	}
	at := time.Now()
	return &at
}
