import { type GridPoint } from '@milgnss/utils/types';
import { Canvas } from './Canvas';
import { GeoPoint } from './GeoPoint';
import { LatAxis } from './LatAxis';
import { LongAxis } from './LongAxis';
import { centerMarkerColor } from './tokens';

export class Grid extends Canvas {
  private readonly markerRadius = 10;

  private readonly axis: {
    lat: LatAxis;
    long: LongAxis;
  };

  constructor(...args: ConstructorParameters<typeof Canvas>) {
    super(...args);

    this.axis = {
      lat: new LatAxis(...args),
      long: new LongAxis(...args),
    };

    this.init();
  }

  get offset() {
    return super.offset;
  }

  set offset(newOffset: GridPoint) {
    super.offset = newOffset;

    this.axis.lat.offset = newOffset;
    this.axis.long.offset = newOffset;

    this.render(true);
  }

  set zoomLevel(newZoomLevel: number) {
    this.zoom = newZoomLevel;

    this.axis.lat.zoomLevel = newZoomLevel;
    this.axis.long.zoomLevel = newZoomLevel;

    this.render(true);
  }

  private init() {
    this.centerContext();
    this.render();
  }

  private renderCenterMarker() {
    this.draw(() => {
      this.context.fillStyle = centerMarkerColor;
      const position = new GeoPoint(this.center.lat, this.center.long)
        .offset(super.offset)
        .zoomLevel(this.zoom)
        .toGridCoordinate({ reference: this.center }).point;

      const cappedPosition = this.cap(position);

      const { within, left, right, top } = this.markerWithinBounds(position);

      if (!within) {
        const rotation = !right ? 90 : !left ? -90 : !top ? 0 : 180;
        this.drawSemiCircle(cappedPosition, this.markerRadius, 'fill', rotation);
      } else {
        this.drawCircle(cappedPosition, this.markerRadius, 'fill');
      }
    });
  }

  private markerWithinBounds = ({ x, y }: GridPoint) => {
    const left = x >= -this.canvasWidth / 2 - this.markerRadius;
    const right = x <= this.canvasWidth / 2 + this.markerRadius;
    const top = y >= -this.canvasHeight / 2 - this.markerRadius;
    const bottom = y <= this.canvasHeight / 2 + this.markerRadius;

    return {
      left,
      right,
      top,
      bottom,
      within: left && right && top && bottom,
    };
  };

  render(performFullReset = false) {
    if (performFullReset) {
      this.resetCanvas();
    }

    this.axis.lat.renderAxis();
    this.axis.long.renderAxis();

    this.renderCenterMarker();
  }

  reset() {
    this.render(true);
  }
}
