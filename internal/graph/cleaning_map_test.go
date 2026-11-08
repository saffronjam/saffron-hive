package graph

import (
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"testing"
)

func TestCleaningMapWorldCoordinatesDoNotDependOnFrameOrigin(t *testing.T) {
	frame := cleaning.MapSnapshot{Width: 100, Height: 80, GridSize: 50, Left: -5000, Top: -3000, Robot: &cleaning.MapPosition{X: 2000, Y: -1000, Angle: 90}}
	mapped := mapCleaningMap(frame)
	if mapped.Robot.X != 2 || mapped.Robot.Y != 1 || mapped.Robot.Angle != 270 || mapped.Origin.X != -5 || mapped.Origin.Y != -1 {
		t.Fatalf("incorrect world frame: %+v %+v", mapped.Robot, mapped.Origin)
	}
	frame.Left = -4000
	frame.Top = -2500
	next := mapCleaningMap(frame)
	if *next.Robot != *mapped.Robot {
		t.Fatal("robot moved when only frame bounds changed")
	}
}
