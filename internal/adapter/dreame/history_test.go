package dreame

import (
	"testing"
)

func TestHistoryUsesReportedCompletionAndStartTime(t *testing.T) {
	records, err := parseHistory([]byte(`{"data":{"list":[{"id":"run","createTime":1794046812027,"history":[{"piid":1,"value":18},{"piid":2,"value":44},{"piid":3,"value":29},{"piid":8,"value":1794044095},{"piid":13,"value":1}]}]}}`))
	if err != nil || len(records) != 1 {
		t.Fatalf("history: %+v %v", records, err)
	}
	r := records[0]
	if r.Completed == nil || !*r.Completed || r.ElapsedMinutes != 44 || r.CleanedArea != 29 || r.StartedAt.Unix() != 1794044095 {
		t.Fatalf("record: %+v", r)
	}
	records, err = parseHistory([]byte(`{"data":{"list":[{"id":"unknown","createTime":1794046812027,"history":[{"piid":8,"value":1794044095}]}]}}`))
	if err != nil || len(records) != 1 || records[0].Completed != nil {
		t.Fatal("missing completion became success")
	}
}
