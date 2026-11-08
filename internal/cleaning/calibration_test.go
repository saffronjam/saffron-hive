package cleaning

import (
	"math"
	"testing"
)

func TestCalibrationTransformsPositionAndHeading(t *testing.T) {
	anchors := []Anchor{{Robot: Point{0, 0}, Hive: Point{5, 7}}, {Robot: Point{2, 0}, Hive: Point{5, 11}}}
	transform, err := Calibrate(anchors)
	if err != nil {
		t.Fatal(err)
	}
	actual := transform.Apply(Point{1, 1})
	if math.Abs(actual.X-3) > 1e-9 || math.Abs(actual.Y-9) > 1e-9 {
		t.Fatalf("wrong transformed point: %+v", actual)
	}
	if math.Abs(transform.Heading(0)-90) > 1e-9 {
		t.Fatal("wrong heading")
	}
	checkpoint := Anchor{Robot: Point{1, 1}, Hive: Point{3, 10}}
	if math.Abs(transform.Error(checkpoint)-1) > 1e-9 {
		t.Fatal("wrong checkpoint error")
	}
}
func TestCalibrationRejectsDegenerateOrNonFiniteAnchors(t *testing.T) {
	cases := [][]Anchor{nil, {{}}, {{Robot: Point{1, 1}}, {Robot: Point{1, 1}, Hive: Point{2, 2}}}, {{Robot: Point{0, 0}}, {Robot: Point{1, 0}}}, {{Robot: Point{math.NaN(), 0}}, {Robot: Point{1, 0}, Hive: Point{2, 0}}}}
	for _, anchors := range cases {
		if _, err := Calibrate(anchors); err == nil {
			t.Fatalf("accepted invalid anchors: %+v", anchors)
		}
	}
}

func TestCalibrationUsesEveryPair(t *testing.T) {
	anchors := []Anchor{{Robot: Point{0, 0}, Hive: Point{1, 1}}, {Robot: Point{2, 0}, Hive: Point{3, 1}}, {Robot: Point{0, 2}, Hive: Point{1, 3}}, {Robot: Point{2, 2}, Hive: Point{3, 3}}}
	fitted, err := Calibrate(anchors)
	if err != nil {
		t.Fatal(err)
	}
	for _, a := range anchors {
		if fitted.Error(a) > 1e-9 {
			t.Fatalf("mismatched point: %+v", a)
		}
	}
	anchors[3].Hive.X += 1
	adjusted, err := Calibrate(anchors)
	if err != nil {
		t.Fatal(err)
	}
	if adjusted == fitted {
		t.Fatal("fourth point did not affect fit")
	}
}
