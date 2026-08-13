package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// GetNetworkTopology returns the stored mesh snapshot for one provider, or
// nil when that provider has never completed a scan.
func (s *DB) GetNetworkTopology(ctx context.Context, provider device.Source) (*device.NetworkTopology, error) {
	row, err := s.q.GetNetworkTopology(ctx, provider)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get network topology: %w", err)
	}
	topo, err := topologyFromRow(row)
	if err != nil {
		return nil, fmt.Errorf("get network topology: %w", err)
	}
	return &topo, nil
}

// ListNetworkTopologies returns every provider's stored mesh snapshot.
func (s *DB) ListNetworkTopologies(ctx context.Context) ([]device.NetworkTopology, error) {
	rows, err := s.q.ListNetworkTopologies(ctx)
	if err != nil {
		return nil, fmt.Errorf("list network topologies: %w", err)
	}
	topos := make([]device.NetworkTopology, 0, len(rows))
	for _, row := range rows {
		topo, err := topologyFromRow(row)
		if err != nil {
			return nil, fmt.Errorf("list network topologies: %w", err)
		}
		topos = append(topos, topo)
	}
	return topos, nil
}

// UpsertNetworkTopology stores a provider's mesh snapshot, replacing any
// previous one.
func (s *DB) UpsertNetworkTopology(ctx context.Context, topo device.NetworkTopology) error {
	nodes, err := json.Marshal(orEmptyNodes(topo.Nodes))
	if err != nil {
		return fmt.Errorf("upsert network topology: marshal nodes: %w", err)
	}
	links, err := json.Marshal(orEmptyLinks(topo.Links))
	if err != nil {
		return fmt.Errorf("upsert network topology: marshal links: %w", err)
	}
	if err := s.q.UpsertNetworkTopology(ctx, sqlite.UpsertNetworkTopologyParams{
		Provider:  topo.Provider,
		Nodes:     string(nodes),
		Links:     string(links),
		ScannedAt: topo.ScannedAt,
	}); err != nil {
		return fmt.Errorf("upsert network topology: %w", err)
	}
	return nil
}

// DeleteNetworkTopology removes a provider's stored mesh snapshot.
func (s *DB) DeleteNetworkTopology(ctx context.Context, provider device.Source) error {
	if err := s.q.DeleteNetworkTopology(ctx, provider); err != nil {
		return fmt.Errorf("delete network topology: %w", err)
	}
	return nil
}

func topologyFromRow(row sqlite.NetworkTopologySnapshot) (device.NetworkTopology, error) {
	var nodes []device.TopologyNode
	if err := json.Unmarshal([]byte(row.Nodes), &nodes); err != nil {
		return device.NetworkTopology{}, fmt.Errorf("unmarshal nodes: %w", err)
	}
	var links []device.TopologyLink
	if err := json.Unmarshal([]byte(row.Links), &links); err != nil {
		return device.NetworkTopology{}, fmt.Errorf("unmarshal links: %w", err)
	}
	return device.NetworkTopology{
		Provider:  row.Provider,
		ScannedAt: row.ScannedAt,
		Nodes:     nodes,
		Links:     links,
	}, nil
}

func orEmptyNodes(nodes []device.TopologyNode) []device.TopologyNode {
	if nodes == nil {
		return []device.TopologyNode{}
	}
	return nodes
}

func orEmptyLinks(links []device.TopologyLink) []device.TopologyLink {
	if links == nil {
		return []device.TopologyLink{}
	}
	return links
}
