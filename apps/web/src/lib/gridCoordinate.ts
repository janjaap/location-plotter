import type { Coordinate } from 'socket/types';
import { ddToDms } from '../utils/ddToDms';

const SECONDS_PER_MINUTE = 60;

export type GridPoint = { x: number; y: number };

export const gridCoordinate = (
  point: Coordinate,
  center: Coordinate,
  columnWidth: number,
  rowHeight: number,
): GridPoint => {
  const pixelsPerLongSecond = columnWidth / SECONDS_PER_MINUTE;
  const pixelsPerLatSecond = rowHeight / SECONDS_PER_MINUTE;

  const coordLatDms = ddToDms(point.lat);
  const coordLongDms = ddToDms(point.long);

  const centerLatDms = ddToDms(center.lat);
  const centerLongDms = ddToDms(center.long);

  const longSecondsDiff =
    coordLongDms.seconds +
    coordLongDms.minutes * SECONDS_PER_MINUTE -
    (centerLongDms.seconds + centerLongDms.minutes * SECONDS_PER_MINUTE);

  const latSecondsDiff =
    centerLatDms.seconds +
    centerLatDms.minutes * SECONDS_PER_MINUTE -
    (coordLatDms.seconds + coordLatDms.minutes * SECONDS_PER_MINUTE);

  const x = Math.round(longSecondsDiff * pixelsPerLongSecond);
  const y = Math.round(latSecondsDiff * pixelsPerLatSecond);

  return { x, y };
};
