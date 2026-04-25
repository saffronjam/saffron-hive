package effect

import (
	"reflect"
	"sort"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestRequiredCapabilities(t *testing.T) {
	cases := []struct {
		name string
		eff  Effect
		want []string
	}{
		{
			name: "empty timeline",
			eff:  Effect{Kind: KindTimeline},
			want: nil,
		},
		{
			name: "wait only contributes nothing",
			eff: Effect{Kind: KindTimeline, Steps: []Step{
				{Kind: StepWait},
				{Kind: StepWait},
			}},
			want: nil,
		},
		{
			name: "set_on_off",
			eff: Effect{Kind: KindTimeline, Steps: []Step{
				{Kind: StepSetOnOff},
			}},
			want: []string{device.CapOnOff},
		},
		{
			name: "set_brightness",
			eff: Effect{Kind: KindTimeline, Steps: []Step{
				{Kind: StepSetBrightness},
			}},
			want: []string{device.CapBrightness},
		},
		{
			name: "set_color_rgb",
			eff: Effect{Kind: KindTimeline, Steps: []Step{
				{Kind: StepSetColorRGB},
			}},
			want: []string{device.CapColor},
		},
		{
			name: "set_color_temp",
			eff: Effect{Kind: KindTimeline, Steps: []Step{
				{Kind: StepSetColorTemp},
			}},
			want: []string{device.CapColorTemp},
		},
		{
			name: "deduplicates repeated step kinds",
			eff: Effect{Kind: KindTimeline, Steps: []Step{
				{Kind: StepSetBrightness},
				{Kind: StepWait},
				{Kind: StepSetBrightness},
			}},
			want: []string{device.CapBrightness},
		},
		{
			name: "union across all controllable steps",
			eff: Effect{Kind: KindTimeline, Steps: []Step{
				{Kind: StepSetOnOff},
				{Kind: StepWait},
				{Kind: StepSetBrightness},
				{Kind: StepSetColorRGB},
				{Kind: StepSetColorTemp},
			}},
			want: []string{
				device.CapOnOff,
				device.CapBrightness,
				device.CapColor,
				device.CapColorTemp,
			},
		},
		{
			name: "native effect returns no caps",
			eff: Effect{Kind: KindNative, NativeName: "candle", Steps: []Step{
				{Kind: StepSetBrightness},
			}},
			want: nil,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := tc.eff.RequiredCapabilities()
			gotSorted := append([]string(nil), got...)
			wantSorted := append([]string(nil), tc.want...)
			sort.Strings(gotSorted)
			sort.Strings(wantSorted)
			if !reflect.DeepEqual(gotSorted, wantSorted) {
				t.Errorf("got %v, want %v", got, tc.want)
			}
		})
	}
}
