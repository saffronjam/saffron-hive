//go:build e2e

package graphql_test

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"testing"

	"github.com/saffronjam/saffron-hive/e2e/infra"
)

var (
	graphqlURL string
	authToken  string
	publisher  *infra.Publisher
)

const expectedDeviceCount = 7

func TestMain(m *testing.M) {
	ctx := context.Background()

	mosquitto, err := infra.StartMosquitto(ctx)
	if err != nil {
		log.Fatalf("start mosquitto: %v", err)
	}

	app, err := infra.StartApp(ctx, mosquitto.BrokerURL)
	if err != nil {
		_ = mosquitto.Stop(ctx)
		log.Fatalf("start app: %v", err)
	}
	graphqlURL = app.GraphQLURL
	authToken = app.AuthToken

	publisher, err = infra.NewPublisher(mosquitto.BrokerURL)
	if err != nil {
		app.Stop()
		_ = mosquitto.Stop(ctx)
		log.Fatalf("create publisher: %v", err)
	}

	devices, err := infra.LoadBridgeDevices()
	if err != nil {
		publisher.Disconnect()
		app.Stop()
		_ = mosquitto.Stop(ctx)
		log.Fatalf("load bridge devices fixture: %v", err)
	}

	if err := publisher.PublishBridgeDevices(devices); err != nil {
		publisher.Disconnect()
		app.Stop()
		_ = mosquitto.Stop(ctx)
		log.Fatalf("publish bridge devices: %v", err)
	}

	if !waitForDevices(expectedDeviceCount) {
		publisher.Disconnect()
		app.Stop()
		_ = mosquitto.Stop(ctx)
		log.Fatalf("timed out waiting for %d devices to appear", expectedDeviceCount)
	}

	code := m.Run()

	publisher.Disconnect()
	app.Stop()
	_ = mosquitto.Stop(ctx)

	os.Exit(code)
}

func waitForDevices(expected int) bool {
	return pollUntil(10_000_000_000, 100_000_000, func() bool {
		data, err := graphqlQuery(`{ devices { id } }`, nil)
		if err != nil {
			return false
		}
		var result struct {
			Devices []struct {
				ID string `json:"id"`
			} `json:"devices"`
		}
		if err := json.Unmarshal(data, &result); err != nil {
			return false
		}
		return len(result.Devices) >= expected
	})
}

func queryDeviceIDByName(name string) (string, error) {
	data, err := graphqlQuery(`{ devices { id name } }`, nil)
	if err != nil {
		return "", err
	}
	var result struct {
		Devices []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"devices"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return "", err
	}
	for _, d := range result.Devices {
		if d.Name == name {
			return d.ID, nil
		}
	}
	return "", fmt.Errorf("device %q not found", name)
}
