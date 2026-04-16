package infra

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

// MosquittoContainer wraps a running Mosquitto testcontainer.
type MosquittoContainer struct {
	Container testcontainers.Container
	BrokerURL string
}

// StartMosquitto starts an eclipse-mosquitto:2 container and returns the broker URL.
func StartMosquitto(ctx context.Context) (*MosquittoContainer, error) {
	confPath := LoadMosquittoConf()

	req := testcontainers.ContainerRequest{
		Name:         fmt.Sprintf("hive-e2e-mosquitto-%s", shortID()),
		Image:        "eclipse-mosquitto:2",
		ExposedPorts: []string{"1883/tcp"},
		Files: []testcontainers.ContainerFile{
			{
				HostFilePath:      confPath,
				ContainerFilePath: "/mosquitto/config/mosquitto.conf",
				FileMode:          0644,
			},
		},
		WaitingFor: wait.ForListeningPort("1883/tcp"),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		return nil, fmt.Errorf("start mosquitto container: %w", err)
	}

	host, err := container.Host(ctx)
	if err != nil {
		return nil, fmt.Errorf("get mosquitto host: %w", err)
	}

	port, err := container.MappedPort(ctx, "1883")
	if err != nil {
		return nil, fmt.Errorf("get mosquitto port: %w", err)
	}

	brokerURL := fmt.Sprintf("%s:%s", host, port.Port())

	return &MosquittoContainer{
		Container: container,
		BrokerURL: brokerURL,
	}, nil
}

// Stop terminates the Mosquitto container.
func (m *MosquittoContainer) Stop(ctx context.Context) error {
	return m.Container.Terminate(ctx)
}

func shortID() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
