import { ddToDms } from '@milgnss/utils';
import {
  PIXELS_PER_LAT_SECOND,
  PIXELS_PER_LONG_SECOND,
  SECONDS_PER_MINUTE,
} from '@milgnss/utils/constants';
import { type Coordinate } from '@milgnss/utils/types';
import { GridCoordinate } from './GridCoordinate';
import { Point } from './Point';

export class GeoPoint extends Point {
  constructor(
    public readonly lat: number,
    public readonly long: number,
  ) {
    super();
    return this;
  }

  get point() {
    return {
      lat: this.lat,
      long: this.long,
    };
  }

  toGridCoordinate({ reference }: { reference: Coordinate }): GridCoordinate {
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

    const point = {
      x: Math.round(longSecondsDiff * PIXELS_PER_LONG_SECOND),
      y: Math.round(latSecondsDiff * PIXELS_PER_LAT_SECOND),
    };

    const { x, y } = this.withZoom(this.withOffset(point));

    return new GridCoordinate(x, y);
  }
}
