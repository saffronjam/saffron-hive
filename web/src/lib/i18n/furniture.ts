import { m } from "$lib/i18n/messages";
import type { FurnitureKind } from "$lib/floorplan/furniture";

const labels = {
  sink: m.map_furniture_sink,
  toilet: m.map_furniture_toilet,
  bathtub: m.map_furniture_bathtub,
  "bed-single": m.map_furniture_bed_single,
  "bed-medium": m.map_furniture_bed_medium,
  "bed-double": m.map_furniture_bed_double,
  "sofa-straight": m.map_furniture_sofa,
  "sofa-corner": m.map_furniture_sofa_corner,
  "sofa-center": m.map_furniture_sofa_center,
  "sofa-side": m.map_furniture_sofa_side,
  armchair: m.map_furniture_armchair,
  box: m.map_furniture_box,
  ellipse: m.map_furniture_ellipse,
} as const;

const groups = {
  fixtures: m.map_furniture_group_fixtures,
  beds: m.map_furniture_group_beds,
  sofas: m.map_furniture_group_sofas,
  shapes: m.map_furniture_group_shapes,
} satisfies Record<FurnitureKind["group"], () => string>;

export function furnitureLabel(id: string): string {
  return labels[id as keyof typeof labels]?.() ?? m.common_unknown_value({ value: id });
}

export function furnitureGroupLabel(group: FurnitureKind["group"]): string {
  return groups[group]();
}
