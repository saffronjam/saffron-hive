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
			name: "empty tracks contribute nothing",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Index: 0},
				{Index: 1},
			}},
			want: nil,
		},
		{
			name: "set_on_off",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Clips: []Clip{{Kind: ClipSetOnOff}}},
			}},
			want: []string{device.CapOnOff},
		},
		{
			name: "set_brightness",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Clips: []Clip{{Kind: ClipSetBrightness}}},
			}},
			want: []string{device.CapBrightness},
		},
		{
			name: "set_color rgb",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Clips: []Clip{{
					Kind: ClipSetColor,
					Config: ClipConfig{SetColor: &SetColorClipConfig{
						Mode: ColorModeRGB,
						RGB:  &SetColorRGBValue{R: 1},
					}},
				}}},
			}},
			want: []string{device.CapColor},
		},
		{
			name: "set_color temp",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Clips: []Clip{{
					Kind: ClipSetColor,
					Config: ClipConfig{SetColor: &SetColorClipConfig{
						Mode: ColorModeTemp,
						Temp: &SetColorTempValue{Mireds: 370},
					}},
				}}},
			}},
			want: []string{device.CapColorTemp},
		},
		{
			name: "set_color rgb and temp clips contribute both caps",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Clips: []Clip{
					{Kind: ClipSetColor, StartMs: 0, Config: ClipConfig{SetColor: &SetColorClipConfig{
						Mode: ColorModeRGB, RGB: &SetColorRGBValue{},
					}}},
					{Kind: ClipSetColor, StartMs: 100, Config: ClipConfig{SetColor: &SetColorClipConfig{
						Mode: ColorModeTemp, Temp: &SetColorTempValue{},
					}}},
				}},
			}},
			want: []string{device.CapColor, device.CapColorTemp},
		},
		{
			name: "native_effect contributes no generic capability",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Clips: []Clip{{Kind: ClipNativeEffect}}},
			}},
			want: nil,
		},
		{
			name: "deduplicates repeated clip kinds across a track",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Clips: []Clip{
					{Kind: ClipSetBrightness, StartMs: 0},
					{Kind: ClipSetBrightness, StartMs: 100},
				}},
			}},
			want: []string{device.CapBrightness},
		},
		{
			name: "deduplicates across tracks",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Clips: []Clip{{Kind: ClipSetBrightness}}},
				{Clips: []Clip{{Kind: ClipSetBrightness}}},
			}},
			want: []string{device.CapBrightness},
		},
		{
			name: "union across all controllable clip kinds",
			eff: Effect{Kind: KindTimeline, Tracks: []Track{
				{Clips: []Clip{
					{Kind: ClipSetOnOff},
					{Kind: ClipSetBrightness, StartMs: 1},
					{Kind: ClipSetColor, StartMs: 2, Config: ClipConfig{SetColor: &SetColorClipConfig{
						Mode: ColorModeRGB, RGB: &SetColorRGBValue{},
					}}},
					{Kind: ClipSetColor, StartMs: 3, Config: ClipConfig{SetColor: &SetColorClipConfig{
						Mode: ColorModeTemp, Temp: &SetColorTempValue{},
					}}},
					{Kind: ClipNativeEffect, StartMs: 4},
				}},
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
			eff: Effect{Kind: KindNative, NativeName: "candle", Tracks: []Track{
				{Clips: []Clip{{Kind: ClipSetBrightness}}},
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
