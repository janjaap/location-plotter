import { EARTH_RADIUS } from '@milgnss/utils/constants';
import { Coordinate } from '@milgnss/utils/types';

const P = Math.PI / 180;

export const getDistance = (coord1: Coordinate, coord2: Coordinate) => {
  const lat1 = coord1.lat * P;
  const lat2 = coord2.lat * P;
  const deltaLat = (coord2.lat - coord1.lat) * P;
  const deltaLong = (coord2.long - coord1.long) * P;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLong / 2) * Math.sin(deltaLong / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
};
