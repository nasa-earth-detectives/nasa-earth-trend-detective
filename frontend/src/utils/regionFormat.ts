interface Compass { north: string; south: string; east: string; west: string }

const degrees = (value: number): string => `${Number(Math.abs(value).toFixed(1))}°`;

/** "15°S–5°N, 75°W–50°W": the limits of a box given by its centre and half-sizes. */
export function formatBox(box: { lat: number; lng: number; latRadius: number; lngRadius: number }, compass: Compass): string {
  const south = Math.max(-90, box.lat - box.latRadius);
  const north = Math.min(90, box.lat + box.latRadius);
  const latitude = (value: number): string => `${degrees(value)}${value >= 0 ? compass.north : compass.south}`;
  const longitude = (value: number): string => `${degrees(value)}${value >= 0 ? compass.east : compass.west}`;
  const across = box.lngRadius >= 180 ? '360°' : `${longitude(box.lng - box.lngRadius)}–${longitude(box.lng + box.lngRadius)}`;
  return `${latitude(south)}–${latitude(north)}, ${across}`;
}
