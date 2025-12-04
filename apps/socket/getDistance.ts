import { EARTH_RADIUS } from '@milgnss/utils/constants';
import { Coordinate } from '@milgnss/utils/types';

const toRadians = (deg: number) => (deg * Math.PI) / 180;

export const getDistance = (coord1: Coordinate, coord2: Coordinate) => {
  const lat1 = coord1.lat;
  const lon1 = coord1.long;
  const lat2 = coord2.lat;
  const lon2 = coord2.long;

  const lat1Radians = toRadians(coord1.lat);
  const lat2Radians = toRadians(coord2.lat);
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLong = toRadians(lon2 - lon1);

  const a =
    Math.pow(Math.sin(deltaLat / 2), 2) +
    Math.cos(lat1Radians) * Math.cos(lat2Radians) * Math.pow(Math.sin(deltaLong / 2), 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
};
