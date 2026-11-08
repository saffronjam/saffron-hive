package dreame

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
)

// History reads bounded cleaning outcome records from the account cloud.
func (s *Session) History(ctx context.Context, d DeviceInfo) ([]cleaning.HistoryRecord, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := s.authenticate(ctx); err != nil {
		return nil, err
	}
	params, _ := json.Marshal(struct {
		UID    string `json:"uid"`
		DID    string `json:"did"`
		From   int64  `json:"from"`
		Limit  int    `json:"limit"`
		SIID   string `json:"siid"`
		EIID   string `json:"eiid"`
		Region string `json:"region"`
		Type   int    `json:"type"`
	}{s.accountID, d.ID, 0, 50, "4", "1", s.credentials.Region, 3})
	raw, err := s.client.read(ctx, "/dreame-user-iot/iotstatus/history", params)
	if err != nil {
		return nil, err
	}
	return parseHistory(raw)
}

func parseHistory(raw json.RawMessage) ([]cleaning.HistoryRecord, error) {
	var envelope struct {
		Data struct {
			List []struct {
				ID      json.RawMessage `json:"id"`
				Created int64           `json:"createTime"`
				History json.RawMessage `json:"history"`
			} `json:"list"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &envelope); err != nil {
		return nil, errors.New("invalid Dreame cleaning history")
	}
	if envelope.Data.List == nil {
		return nil, errors.New("Dreame cleaning history is unavailable")
	}
	result := []cleaning.HistoryRecord{}
	seen := map[int64]bool{}
	for _, row := range envelope.Data.List {
		data := row.History
		if len(data) > 0 && data[0] == '"' {
			var text string
			if json.Unmarshal(data, &text) != nil {
				continue
			}
			data = []byte(text)
		}
		var properties []struct {
			ID    int             `json:"piid"`
			Value json.RawMessage `json:"value"`
		}
		if json.Unmarshal(data, &properties) != nil {
			continue
		}
		record := cleaning.HistoryRecord{ID: jsonString(row.ID), FinishedAt: time.UnixMilli(row.Created).UTC()}
		for _, p := range properties {
			var number float64
			if json.Unmarshal(p.Value, &number) != nil {
				continue
			}
			switch p.ID {
			case 2:
				record.ElapsedMinutes = number
			case 3:
				record.CleanedArea = number
			case 8:
				record.StartedAt = time.Unix(int64(number), 0).UTC()
			case 13:
				completed := number == 1
				record.Completed = &completed
			case 42:
				record.MapID = strconv.Itoa(int(number))
			}
		}
		if record.ID != "" && !record.StartedAt.IsZero() && !record.FinishedAt.Before(record.StartedAt) && record.ElapsedMinutes >= 0 && record.CleanedArea >= 0 {
			if !seen[record.StartedAt.Unix()] {
				result = append(result, record)
				seen[record.StartedAt.Unix()] = true
			}
		}
	}
	return result, nil
}
