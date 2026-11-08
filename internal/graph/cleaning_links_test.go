package graph

import (
	"encoding/json"
	"testing"
)

func TestEmptyCleaningLinksRetainRevisionForRelinking(t *testing.T) {
	env, _, _ := cleaningEnvironment(t)
	mutation := `mutation($input:CleaningRoomLinksInput!){updateCleaningRoomLinks(input:$input){mapId revision links{roomId areaId}}}`
	input := map[string]any{"deviceId": "robot", "mapId": "7", "mapRevision": "geometry", "expectedRevision": 1, "links": []any{}}
	cleared := env.query(t, mutation, map[string]any{"input": input})
	if len(cleared.Errors) > 0 {
		t.Fatalf("clear: %+v", cleared.Errors)
	}

	read := env.query(t, `{cleaningDevice(deviceId:"robot"){roomLinks{mapId revision links{roomId areaId}}}}`, nil)
	if len(read.Errors) > 0 {
		t.Fatal(read.Errors)
	}

	var payload struct {
		Device struct {
			Sets []struct {
				MapID    string
				Revision int
			} `json:"roomLinks"`
		} `json:"cleaningDevice"`
	}
	if err := json.Unmarshal(read.Data, &payload); err != nil {
		t.Fatal(err)
	}
	revision := 0
	for _, set := range payload.Device.Sets {
		if set.MapID == "7" {
			revision = set.Revision
		}
	}
	if revision != 2 {
		t.Fatalf("empty link set lost its revision: %s", read.Data)
	}
	input["expectedRevision"] = revision
	input["links"] = []any{map[string]any{"roomId": "kitchen", "areaId": "1"}}
	relink := env.query(t, mutation, map[string]any{"input": input})

	if len(relink.Errors) > 0 {
		t.Fatalf("relink rejected after reload: %+v", relink.Errors)
	}
}
