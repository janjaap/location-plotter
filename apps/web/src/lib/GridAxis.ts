import { closestMinute, diffInSeconds } from '@milgnss/utils';
import type { FromTo, GridPoint } from '@milgnss/utils/types';
import { Canvas } from './Canvas';

const BOUNDS_MULTIPLIER = 10;

export abstract class GridAxis extends Canvas {
  abstract labelFitsWithinBounds: (xOrYpos: number) => boolean;
  abstract labelOrigin: (pos: number) => GridPoint;
  abstract labelPosition: (pos: number) => GridPoint;
  abstract labelX: (pos: number) => number | (() => number);
  abstract labelY: (pos: number) => number | (() => number);
  abstract makeLineCoords: (xOrYpos: number) => FromTo;

  protected abstract readonly degrees: number; // lat or long decimal degrees
  protected abstract readonly minuteOffset: number;
  protected abstract readonly pixelsPerSecond: number;
  protected abstract readonly subDivSize: number;

  protected abstract axisFitsWithinBounds(xOrYpos: number): boolean;

  get axisBounds() {
    return {
      top: this.bounds.top * BOUNDS_MULTIPLIER,
      right: this.bounds.right * BOUNDS_MULTIPLIER,
      bottom: this.bounds.bottom * BOUNDS_MULTIPLIER,
      left: this.bounds.left * BOUNDS_MULTIPLIER,
    };
  }

  set zoomLevel(newZoomLevel: number) {
    this.zoom = newZoomLevel;
  }

  baseOffset = (offset?: number) => {
    const closest = closestMinute(this.degrees, offset);

    return this.secondsToCenter(closest) * this.pixelsPerSecond * Math.sign(closest - this.degrees);
  };

  getClosestMinute = (offset?: number) => closestMinute(this.degrees, offset);

  protected secondsToCenter = (decimalDegrees: number) =>
    diffInSeconds(decimalDegrees, this.degrees);

  protected fitsWithinBounds(gridPoint: GridPoint) {
    const { x, y } = gridPoint;

    return (
      x >= this.axisBounds.left &&
      x <= this.axisBounds.right &&
      y >= this.axisBounds.top &&
      y <= this.axisBounds.bottom
    );
  }

  reset() {}
}
