import { ddToDms, dmsToDd } from '@milgnss/utils';
import {
  MINUTES_PER_HOUR,
  PIXELS_PER_LAT_SECOND,
  PIXELS_PER_LONG_SECOND,
  SECONDS_PER_MINUTE,
} from '@milgnss/utils/constants';
import type { Coordinate, GridPoint } from '@milgnss/utils/types';
import { GeoPoint } from './GeoPoint';
import { Point } from './Point';

export class GridCoordinate extends Point {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {
    super();
    return this;
  }

  get point(): GridPoint {
    return this.withZoom(
      this.withOffset({
        x: this.x,
        y: this.y,
      }),
    );
  }

  toGeoPoint({ reference }: { reference: Coordinate }): GeoPoint {
    const { x, y } = this.point;

    const centerLatDms = ddToDms(reference.lat);
    const centerLongDms = ddToDms(reference.long);

    const centerLongSeconds = centerLongDms.seconds + centerLongDms.minutes * SECONDS_PER_MINUTE;
    const centerLatSeconds = centerLatDms.seconds + centerLatDms.minutes * SECONDS_PER_MINUTE;

    const longSeconds = x / PIXELS_PER_LONG_SECOND;
    const latSeconds = y / PIXELS_PER_LAT_SECOND;

    const coordLongSeconds = centerLongSeconds + longSeconds;
    const coordLatSeconds = centerLatSeconds - latSeconds;

    const lat = dmsToDd({
      degrees: centerLatDms.degrees,
      minutes: Math.floor(coordLatSeconds / MINUTES_PER_HOUR),
      seconds: coordLatSeconds % SECONDS_PER_MINUTE,
    });

    const long = dmsToDd({
      degrees: centerLongDms.degrees,
      minutes: Math.floor(coordLongSeconds / MINUTES_PER_HOUR),
      seconds: coordLongSeconds % SECONDS_PER_MINUTE,
    });

    return new GeoPoint(lat, long);
  }
}
