import { earthRadius } from './constants';

export const updatePosition = (
  lat: number,
  long: number,
  speedKnots: number,
  headingDeg: number,
  durationInSeconds: number,
) => {
  // Constants
  const metersPerSecond = speedKnots * (1852 / 3600); // Convert knots to m/s
  const distanceTraveled = metersPerSecond * durationInSeconds; // distance = speed * time

  // Convert to radians
  const headingRad = (headingDeg * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const longRad = (long * Math.PI) / 180;

  // Compute new latitude
  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceTraveled / earthRadius) +
      Math.cos(latRad) *
        Math.sin(distanceTraveled / earthRadius) *
        Math.cos(headingRad),
  );

  // Compute new longitude
  const newLongRad =
    longRad +
    Math.atan2(
      Math.sin(headingRad) *
        Math.sin(distanceTraveled / earthRadius) *
        Math.cos(latRad),
      Math.cos(distanceTraveled / earthRadius) -
        Math.sin(latRad) * Math.sin(newLatRad),
    );

  // Convert back to degrees
  const newLat = (newLatRad * 180) / Math.PI;
  const newLong = (newLongRad * 180) / Math.PI;

  return { lat: newLat, long: newLong };
};
