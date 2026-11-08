package cleaning

import "time"

// HistoryRecord is an outcome reported by a provider, independent of a Hive request.
type HistoryRecord struct {
	ID             string
	StartedAt      time.Time
	FinishedAt     time.Time
	Completed      *bool
	ElapsedMinutes float64
	CleanedArea    float64
	MapID          string
}
