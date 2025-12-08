import { PIXELS_PER_LAT_SECOND, PIXELS_PER_LONG_SECOND, SECONDS_PER_MINUTE } from './constants';
import { ddToDms } from './ddToDms';
import type { Coordinate, GridPoint } from './types';
import { zoomLevelToFactor } from './zoomLevelToFactor';

interface GridCoordinateParams {
  position: Coordinate;
  reference: Coordinate;
  offset?: GridPoint;
  zoomLevel?: number;
}

export const gridCoordinate = ({
  position,
  reference,
  offset = { x: 0, y: 0 },
  zoomLevel = 1,
}: GridCoordinateParams): GridPoint => {
  const zoomFactor = zoomLevelToFactor(zoomLevel);
  const coordLatDms = ddToDms(position.lat);
  const coordLongDms = ddToDms(position.long);

  const centerLatDms = ddToDms(reference.lat);
  const centerLongDms = ddToDms(reference.long);

  const longSecondsDiff =
    coordLongDms.seconds +
    coordLongDms.minutes * SECONDS_PER_MINUTE -
    (centerLongDms.seconds + centerLongDms.minutes * SECONDS_PER_MINUTE);

  const latSecondsDiff =
    centerLatDms.seconds +
    centerLatDms.minutes * SECONDS_PER_MINUTE -
    (coordLatDms.seconds + coordLatDms.minutes * SECONDS_PER_MINUTE);

  const x = Math.round(longSecondsDiff * PIXELS_PER_LONG_SECOND * zoomFactor);
  const y = Math.round(latSecondsDiff * PIXELS_PER_LAT_SECOND * zoomFactor);

  if (offset) {
    return { x: x + offset.x, y: y + offset.y };
  }

  return { x, y };
};
