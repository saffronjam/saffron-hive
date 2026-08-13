-- name: GetNetworkTopology :one
SELECT provider, nodes, links, scanned_at
FROM network_topology_snapshots
WHERE provider = ?;

-- name: ListNetworkTopologies :many
SELECT provider, nodes, links, scanned_at
FROM network_topology_snapshots
ORDER BY provider;

-- name: UpsertNetworkTopology :exec
INSERT INTO network_topology_snapshots (provider, nodes, links, scanned_at)
VALUES (?, ?, ?, ?)
ON CONFLICT(provider) DO UPDATE SET
    nodes      = excluded.nodes,
    links      = excluded.links,
    scanned_at = excluded.scanned_at;

-- name: DeleteNetworkTopology :exec
DELETE FROM network_topology_snapshots WHERE provider = ?;
