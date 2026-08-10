/** Where the sun is, seen from a point on the ground. */
export interface SunPosition {
  /** Degrees above the horizon. Negative when the sun is down. */
  elevation: number;
  /** Compass bearing in degrees, clockwise from north. */
  azimuth: number;
}

const DEG = Math.PI / 180;

/** Julian date of an instant. 2440587.5 is the Julian date of the Unix epoch. */
function julianDate(at: Date): number {
  return at.getTime() / 86_400_000 + 2440587.5;
}

function wrap360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * The sun's elevation and azimuth for an instant and a place on Earth, by the
 * Astronomical Almanac's low-precision algorithm (Michalsky 1988) — good to
 * about a hundredth of a degree from 1950 to 2050, which is far finer than a
 * floor plan can show.
 *
 * `at` is an absolute instant, so the viewer's time zone never enters into it;
 * `longitude` alone decides how far the day has run at that place.
 */
export function sunPosition(at: Date, latitude: number, longitude: number): SunPosition {
  const n = julianDate(at) - 2451545.0;

  const meanLongitude = wrap360(280.46 + 0.9856474 * n);
  const meanAnomaly = wrap360(357.528 + 0.9856003 * n) * DEG;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * DEG;
  const obliquity = (23.439 - 0.0000004 * n) * DEG;

  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));

  // Greenwich mean sidereal time in hours, then the local hour angle.
  const utcHours = at.getUTCHours() + at.getUTCMinutes() / 60 + at.getUTCSeconds() / 3600;
  const gmst = 6.697375 + 0.0657098242 * n + utcHours;
  const localSidereal = (gmst + longitude / 15) * 15 * DEG;
  const hourAngle = localSidereal - rightAscension;

  const lat = latitude * DEG;
  const sinElevation =
    Math.sin(declination) * Math.sin(lat) +
    Math.cos(declination) * Math.cos(lat) * Math.cos(hourAngle);
  const elevation = Math.asin(Math.min(1, Math.max(-1, sinElevation)));

  const azimuth = Math.atan2(
    -Math.cos(declination) * Math.sin(hourAngle),
    Math.sin(declination) * Math.cos(lat) -
      Math.cos(declination) * Math.sin(lat) * Math.cos(hourAngle),
  );

  return { elevation: elevation / DEG, azimuth: wrap360(azimuth / DEG) };
}
