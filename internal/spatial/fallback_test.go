package spatial

import (
	"reflect"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestFallbackZeroOneTwoAndDistribution(t *testing.T) {
	if got := fallbackPoints(nil, 1); len(got) != 0 {
		t.Fatalf("zero = %#v", got)
	}
	one := fallbackPoints([]device.DeviceID{"a"}, 1)
	if one["a"].X != 0.5 || one["a"].Y != 0.5 {
		t.Fatalf("one = %#v", one)
	}
	two := fallbackPoints([]device.DeviceID{"a", "b"}, 1)
	if two["a"].X+two["b"].X < 0.999999 || two["a"].X+two["b"].X > 1.000001 ||
		two["a"].Y+two["b"].Y < 0.999999 || two["a"].Y+two["b"].Y > 1.000001 {
		t.Fatalf("two not symmetric = %#v", two)
	}
	ids := []device.DeviceID{"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"}
	points := fallbackPoints(ids, 29)
	seen := map[[2]float64]bool{}
	for _, id := range ids {
		point := points[id]
		key := [2]float64{point.X, point.Y}
		if seen[key] || point.X < 0.08 || point.X > 0.92 || point.Y < 0.08 || point.Y > 0.92 {
			t.Fatalf("bad distributed point %s=%#v", id, point)
		}
		seen[key] = true
	}
}

func TestFallbackDeterminismSeedAndUnrelatedStability(t *testing.T) {
	ids := []device.DeviceID{"a", "b", "c"}
	first := fallbackPoints(ids, 10)
	second := fallbackPoints(ids, 10)
	if !reflect.DeepEqual(first, second) {
		t.Fatal("fallback is nondeterministic")
	}
	different := fallbackPoints(ids, 11)
	if reflect.DeepEqual(first, different) {
		t.Fatal("seed did not vary fallback")
	}
	withUnrelated := fallbackPoints([]device.DeviceID{"a", "b", "c", "unrelated"}, 10)
	for _, id := range ids {
		if first[id] != withUnrelated[id] {
			t.Fatalf("%s moved after unrelated device: %#v %#v", id, first[id], withUnrelated[id])
		}
	}
}

func TestNormalizePointSetCreatesMinimumExtentAndNoCollision(t *testing.T) {
	points := []DevicePoint{
		{DeviceID: "a", Point: fallbackPoints([]device.DeviceID{"single"}, 1)["single"]},
		{DeviceID: "b", Point: fallbackPoints([]device.DeviceID{"single"}, 1)["single"]},
		{DeviceID: "c", Point: fallbackPoints([]device.DeviceID{"single"}, 1)["single"]},
	}
	normalizePointSet(points)
	seen := map[[2]float64]bool{}
	for _, point := range points {
		key := [2]float64{point.Point.X, point.Point.Y}
		if seen[key] {
			t.Fatalf("collision after normalization: %#v", points)
		}
		seen[key] = true
	}
}
