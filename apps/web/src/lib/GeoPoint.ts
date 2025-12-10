import { ddToDms, zoomLevelToFactor } from '@milgnss/utils';
import {
  PIXELS_PER_LAT_SECOND,
  PIXELS_PER_LONG_SECOND,
  SECONDS_PER_MINUTE,
} from '@milgnss/utils/constants';
import { type Coordinate, type GridPoint } from '@milgnss/utils/types';

export class GeoPoint {
  private translationOffset: GridPoint = { x: 0, y: 0 };
  private zoomFactor = 1;

  constructor(
    public readonly lat: number,
    public readonly long: number,
  ) {
    return this;
  }

  private withZoom = (gridPoint: GridPoint): GridPoint => ({
    x: gridPoint.x * this.zoomFactor,
    y: gridPoint.y * this.zoomFactor,
  });

  private withOffset = (gridPoint: GridPoint): GridPoint => ({
    x: gridPoint.x + this.translationOffset.x,
    y: gridPoint.y + this.translationOffset.y,
  });

  offset(newOffset: GridPoint) {
    this.translationOffset = newOffset;
    return this;
  }

  zoomLevel(zoomLevel: number) {
    this.zoomFactor = zoomLevelToFactor(zoomLevel);
    return this;
  }

  gridCoordinate({ reference }: { reference: Coordinate }): GridPoint {
    const coordLatDms = ddToDms(this.lat);
    const coordLongDms = ddToDms(this.long);

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

    const x = Math.round(longSecondsDiff * PIXELS_PER_LONG_SECOND);
    const y = Math.round(latSecondsDiff * PIXELS_PER_LAT_SECOND);

    return this.withOffset(this.withZoom({ x, y }));
  }
}
