package graph

import (
	"github.com/saffronjam/saffron-hive/internal/adapter/dreame"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"math"
)

func mapDreameReads(reads []dreame.Read) []*model.DreameDiagnosticRead {
	result := make([]*model.DreameDiagnosticRead, 0, len(reads))
	for _, read := range reads {
		result = append(result, &model.DreameDiagnosticRead{Name: read.Name, JSON: read.JSON, Error: read.Error})
	}
	return result
}

func mapDreameReport(report dreame.Report) *model.DreameDiagnosticsReport {
	result := &model.DreameDiagnosticsReport{
		CompletedAt:   report.CompletedAt,
		Authenticated: report.Authenticated,
		Reads:         mapDreameReads(report.Reads),
		Devices:       make([]*model.DreameDeviceReport, 0, len(report.Devices)),
	}
	for _, device := range report.Devices {
		d := &model.DreameDeviceReport{ID: device.ID, Name: device.Name, Model: device.Model, Reads: mapDreameReads(device.Reads), Properties: make([]*model.DreameDiagnosticProperty, 0, len(device.Properties)), Maps: make([]*model.CleaningMap, 0, len(device.Maps))}
		for _, p := range device.Properties {
			d.Properties = append(d.Properties, &model.DreameDiagnosticProperty{Name: p.Name, Siid: p.SIID, Piid: p.PIID, Value: p.Value, Code: p.Code})
		}
		for _, snapshot := range device.Maps {
			d.Maps = append(d.Maps, mapCleaningMap(snapshot))
		}
		result.Devices = append(result.Devices, d)
	}
	return result
}

func mapCleaningPoint(m cleaning.MapSnapshot, x, y float64) *model.CleaningMapPoint {
	return &model.CleaningMapPoint{X: x / 1000, Y: -y / 1000}
}
func mapCleaningPoints(m cleaning.MapSnapshot, points []cleaning.MapPoint) []*model.CleaningMapPoint {
	result := make([]*model.CleaningMapPoint, 0, len(points))
	for _, p := range points {
		result = append(result, mapCleaningPoint(m, p.X, p.Y))
	}
	return result
}
func mapCleaningPosition(m cleaning.MapSnapshot, p *cleaning.MapPosition) *model.CleaningMapPosition {
	if p == nil {
		return nil
	}
	q := mapCleaningPoint(m, p.X, p.Y)
	return &model.CleaningMapPosition{X: q.X, Y: q.Y, Angle: math.Mod(360-p.Angle, 360)}
}
func mapCleaningMap(m cleaning.MapSnapshot) *model.CleaningMap {
	result := &model.CleaningMap{Revision: m.Revision, ID: m.ID, Name: m.Name, Width: m.Width, Height: m.Height, MetersPerPixel: float64(m.GridSize) / 1000, Origin: &model.CleaningMapPoint{X: float64(m.Left) / 1000, Y: -float64(m.Top+m.Height*m.GridSize) / 1000}, Rotation: m.Rotation, Robot: mapCleaningPosition(m, m.Robot), Dock: mapCleaningPosition(m, m.Dock), Path: mapCleaningPoints(m, m.Path), Layers: []*model.CleaningMapLayer{}, Rooms: []*model.CleaningMapRoom{}, Areas: []*model.CleaningMapArea{}, Walls: [][]*model.CleaningMapPoint{}}
	for _, l := range m.Layers {
		result.Layers = append(result.Layers, &model.CleaningMapLayer{Kind: l.Kind, RoomID: l.RoomID, Path: l.Path})
	}
	for _, r := range m.Rooms {
		p := mapCleaningPoint(m, r.X, r.Y)
		result.Rooms = append(result.Rooms, &model.CleaningMapRoom{ID: r.ID, Name: r.Name, X: p.X, Y: p.Y, Area: r.Area})
	}
	for _, a := range m.Areas {
		result.Areas = append(result.Areas, &model.CleaningMapArea{Kind: a.Kind, Points: mapCleaningPoints(m, a.Points)})
	}
	for _, w := range m.Walls {
		result.Walls = append(result.Walls, mapCleaningPoints(m, w))
	}
	return result
}
