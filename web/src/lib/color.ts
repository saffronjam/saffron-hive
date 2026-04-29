export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface XyColor {
  x: number;
  y: number;
}

/**
 * Convert sRGB (0..255 per channel) to CIE xyY chromaticity. Applies sRGB
 * gamma correction, multiplies by the standard sRGB → CIE XYZ matrix, then
 * normalises x = X / (X+Y+Z), y = Y / (X+Y+Z). Output rounded to 4 decimal
 * places, matching zigbee2mqtt's expected precision.
 */
export function rgbToXy(r: number, g: number, b: number): XyColor {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  const X = rn * 0.4124 + gn * 0.3576 + bn * 0.1805;
  const Y = rn * 0.2126 + gn * 0.7152 + bn * 0.0722;
  const Z = rn * 0.0193 + gn * 0.1192 + bn * 0.9505;

  const sum = X + Y + Z;
  if (sum === 0) return { x: 0, y: 0 };
  return {
    x: Math.round((X / sum) * 10000) / 10000,
    y: Math.round((Y / sum) * 10000) / 10000,
  };
}
