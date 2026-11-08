package cleaning

import "time"

// Action identifies a provider-neutral vacuum control.
type Action string

const (
	ActionPause    Action = "pause"
	ActionResume   Action = "resume"
	ActionStop     Action = "stop"
	ActionDock     Action = "dock"
	ActionLocate   Action = "locate"
	ActionEmptyBin Action = "empty_bin"
)

// Status is the provider-neutral activity last reported by a cleaning device.
type Status string

const (
	StatusUnknown   Status = "unknown"
	StatusIdle      Status = "idle"
	StatusCleaning  Status = "cleaning"
	StatusPaused    Status = "paused"
	StatusReturning Status = "returning"
	StatusDocked    Status = "docked"
	StatusAttention Status = "attention"
)

// Consumable reports remaining life without interpreting unsupported readings as zero.
type Consumable struct {
	Name       string
	Percent    float64
	Resettable bool
}

// Snapshot is reported robot state; requests and calibration are stored separately.
type Snapshot struct {
	DeviceID       string
	Supported      bool
	Model          string
	ModelID        string
	ImageSources   []string
	Manufacturer   string
	Actions        []Action
	Status         Status
	Battery        *float64
	Suction        *int
	Water          *int
	ElapsedMinutes *float64
	CleanedArea    *float64
	Progress       *float64
	Consumables    []Consumable
	Error          string
	UpdatedAt      time.Time
	ActiveMapID    int
	TaskStatus     *int
	Maps           []MapSnapshot
	LiveMap        *MapSnapshot
	LiveAt         *time.Time
	MapError       string
	History        []HistoryRecord
	HistoryAt      time.Time
}

// Supports reports whether the adapter advertises a control for this vacuum.
func (s Snapshot) Supports(action Action) bool {
	for _, supported := range s.Actions {
		if supported == action {
			return true
		}
	}
	return false
}

// Active reports whether frequent polling is required.
func (s Snapshot) Active() bool {
	return s.Status == StatusCleaning || s.Status == StatusPaused || s.Status == StatusReturning
}
