package serve

import (
	"testing"

	"github.com/robfig/cron/v3"
)

func TestScanCronSpec(t *testing.T) {
	cases := []struct {
		hour, minute int64
		want         string
	}{
		{4, 30, "30 4 * * *"},
		{0, 0, "0 0 * * *"},
		{23, 59, "59 23 * * *"},
	}
	for _, c := range cases {
		got := scanCronSpec(c.hour, c.minute)
		if got != c.want {
			t.Errorf("scanCronSpec(%d, %d) = %q, want %q", c.hour, c.minute, got, c.want)
		}
		if _, err := cron.ParseStandard(got); err != nil {
			t.Errorf("spec %q does not parse: %v", got, err)
		}
	}
}
