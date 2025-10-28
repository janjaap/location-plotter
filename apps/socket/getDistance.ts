import { earthRadius } from './constants';
import { Coordinate } from './types';

const P = Math.PI / 180;

export const getDistance = (coord1: Coordinate, coord2: Coordinate) => {
  const lat1 = coord1.lat * P;
  const lat2 = coord2.lat * P;
  const deltaLat = (coord2.lat - coord1.lat) * P;
  const deltaLong = (coord2.long - coord1.long) * P;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLong / 2) *
      Math.sin(deltaLong / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

export function distance(coord1: Coordinate, coord2: Coordinate) {
  let { lat: lat1, long: lon1 } = coord1;
  let { lat: lat2, long: lon2 } = coord2;

  // The math module contains a function
  // named toRadians which converts from
  // degrees to radians.
  lon1 = (lon1 * Math.PI) / 180;
  lon2 = (lon2 * Math.PI) / 180;
  lat1 = (lat1 * Math.PI) / 180;
  lat2 = (lat2 * Math.PI) / 180;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

  let c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth in kilometers. Use 3956
  // for miles
  let r = 6371;

  // calculate the result
  return c * r;
}
