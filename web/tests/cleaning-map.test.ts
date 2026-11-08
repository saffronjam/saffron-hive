import { describe, expect, it } from "vitest";
import {
  fitCleaningMap,
  rotateCleaningPoint,
  transformCleaningPoint,
} from "../src/lib/cleaning-map";
import { cleaningMapFixture } from "./fixtures/cleaning-map";

describe("cleaning map alignment", () => {
  it("fits all pairs, including those beyond the third", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 2 },
    ];
    const anchors = points.map((robot) => ({
      robot,
      hive: { x: 5 - robot.y * 2, y: 7 + robot.x * 2 },
    }));
    const transform = fitCleaningMap(anchors)!;
    for (const pair of anchors) {
      const result = transformCleaningPoint(transform, pair.robot);
      expect(result.x).toBeCloseTo(pair.hive.x);
      expect(result.y).toBeCloseTo(pair.hive.y);
    }
    anchors[3].hive.x += 1;
    expect(fitCleaningMap(anchors)).not.toEqual(transform);
  });

  it("leaves incomplete or degenerate alignments without a transform", () => {
    expect(fitCleaningMap([])).toBeNull();
    expect(
      fitCleaningMap([{ robot: { x: 1, y: 1 }, hive: { x: 2, y: 2 } }]),
    ).toBeNull();
    expect(
      fitCleaningMap([
        { robot: { x: 1, y: 1 }, hive: { x: 2, y: 2 } },
        { robot: { x: 1, y: 1 }, hive: { x: 3, y: 3 } },
      ]),
    ).toBeNull();
  });

  it.each([0, 90, 180, 270])(
    "preserves coordinates when rotating the display by %s degrees",
    (angle) => {
      const point = { x: -3.5, y: 1.25 };
      const shown = rotateCleaningPoint(cleaningMapFixture, point, angle);
      const original = rotateCleaningPoint(cleaningMapFixture, shown, -angle);
      expect(original.x).toBeCloseTo(point.x);
      expect(original.y).toBeCloseTo(point.y);
    },
  );
});
