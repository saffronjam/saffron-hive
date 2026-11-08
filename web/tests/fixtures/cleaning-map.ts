import type { CleaningMap } from "../../src/lib/gql/graphql";

export const cleaningMapFixture: CleaningMap = {
  id: 7,
  revision: "fixture",
  name: "Ground floor",
  width: 180,
  height: 120,
  metersPerPixel: 0.05,
  origin:{x:-5,y:-2.5},
  rotation: 0,
  robot: { x: 1.0, y: 0.5, angle: 90 },
  dock: { x: -4.0, y: 3.0, angle: 0 },
  layers: [
    { kind: "room", roomId: 1, path: "M10 10h70v100H10z" },
    { kind: "room", roomId: 2, path: "M80 10h90v100H80z" },
    { kind: "wall", roomId: 0, path: "M5 5h170v110H5zM10 10v100h160V10z" },
  ],
  rooms: [
    { id: 1, name: "Kitchen", x: -2.75, y: 0.5, area: 17.5 },
    { id: 2, name: "Living room", x: 1.25, y: 0.5, area: 22.5 },
  ],
  areas: [{ kind: "no_go", points: [{ x: 2.5, y: -1.0 }, { x: 3.0, y: -1.0 }, { x: 3.0, y: -1.5 }, { x: 2.5, y: -1.5 }] }],
  walls: [],
  path: [{ x: -3.5, y: -0.5 }, { x: -2.0, y: -0.5 }, { x: -2.0, y: 1.5 }],
};
