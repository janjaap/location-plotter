import type { Coordinate } from 'socket/types';
import type { FromTo } from '../types';
import { coordsToDmsFormatted, ddToDms, ddToDmsFormatted } from '../utils/ddToDms';
import { dmsToDd } from '../utils/dmsToDd';
import { SECONDS_PER_MINUTE } from './gridCoordinate';
import { Observable } from './Obserservable';
import { gridLabelColor, gridLineColor, subgridLabelColor } from './tokens';

type DrawAxisSideParams = {
  orientation: 'lat' | 'long';
  baseOffset: number;
  pixelsPerMinute: number;
  subDivSize: number;
  direction: 1 | -1;
  getClosestMinute: (offset?: number) => number;
  boundsStart: number;
  boundsEnd: number;
};

type MakeLineCoordsParams = {
  orientation: 'lat' | 'long';
  pos: number;
  start: number;
  end: number;
};

export class Grid extends Observable {
  private readonly gridPadding = 10;

  private readonly gridLabelWidth = 80;

  private minuteDivisions = 2;

  private maxGridSubdivWidth = 165;

  private minGridSubdivWidth = 125;

  private readonly gridLimit = {
    top: this.gridPadding,
    right: this.gridPadding,
    bottom: 2 * this.gridPadding, // prevent overlap with longitude labels
    left: this.gridPadding, // prevent overlap with latitude labels
  };

  private visibleMinutes = 2;

  private readonly visibleSeconds = this.visibleMinutes * SECONDS_PER_MINUTE;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  get bounds() {
    return {
      top: (this.canvasHeight / 2 - this.gridLimit.top) * -1,
      right: this.canvasWidth / 2 - this.gridLimit.right,
      bottom: this.canvasHeight / 2 - this.gridLimit.bottom,
      left: (this.canvasWidth / 2 - this.gridLimit.left - this.gridLabelWidth) * -1,
    };
  }

  get canvasHeight() {
    return this.canvas.height;
  }

  get canvasWidth() {
    return this.canvas.width;
  }

  get zoom() {
    return super.zoom;
  }

  set zoom(zoomLevel: number) {
    const currentFactor = super.zoom;
    super.zoom = zoomLevel;

    this.maxGridSubdivWidth = (this.maxGridSubdivWidth / currentFactor) * super.zoom;
    this.minGridSubdivWidth = (this.minGridSubdivWidth / currentFactor) * super.zoom;

    this.drawGrid();
  }

  private init() {
    this.resizeObserver(this.drawGrid.bind(this));
    this.drawGrid();
  }

  private closestMinute(decimalDegrees: number, offset?: number) {
    const dms = ddToDms(decimalDegrees);
    const result = { ...dms };

    if (dms.seconds === 0) {
      return decimalDegrees;
    }

    if (result.seconds >= 30) {
      result.minutes += 1;

      if (result.minutes === 60) {
        result.minutes = 0;
        result.degrees += 1;
      }
    }

    if (offset) {
      result.minutes += offset;
    }

    result.seconds = 0;

    return dmsToDd(result);
  }

  private closestLongMinute = (offset?: number) => {
    return this.closestMinute(this.center.long, offset);
  };

  private closestLatMinute = (offset?: number) => {
    return this.closestMinute(this.center.lat, offset);
  };

  private diffInSeconds(from: number, to: number) {
    return (from - to) * 3600;
  }

  private reset() {
    this.clearCanvas();
    this.centerContext();
  }

  private determineMinuteDivisions(direction: 'lat' | 'long') {
    const availableSpace =
      direction === 'long'
        ? (this.bounds.right - this.bounds.left) / 2
        : (this.bounds.bottom - this.bounds.top) / 2;
    const maxAmountSubDivs = Math.floor(availableSpace / this.maxGridSubdivWidth);

    this.minuteDivisions = maxAmountSubDivs;
  }

  private drawGrid = () => {
    console.log('Drawing grid...');
    this.reset();
    this.drawLongitudeLines();
    this.drawLatitudeLines();
  };

  private makeLineCoords({ orientation, pos, start, end }: MakeLineCoordsParams): FromTo {
    return orientation === 'long'
      ? { from: { x: pos, y: start }, to: { x: pos, y: end } }
      : { from: { x: start, y: pos }, to: { x: end, y: pos } };
  }

  private drawAxisSide({
    orientation,
    baseOffset,
    pixelsPerMinute,
    subDivSize,
    direction,
    getClosestMinute,
    boundsStart,
    boundsEnd,
  }: DrawAxisSideParams) {
    const canvasLimit = orientation === 'lat' ? this.canvasHeight / 2 : this.canvasWidth / 2;
    const maxDistance = direction === 1 ? canvasLimit - baseOffset : -canvasLimit - baseOffset;
    let minuteOffset = direction;
    let pos = baseOffset + direction * pixelsPerMinute;

    // Main minute lines
    while (
      Math.abs(pos) < Math.abs(maxDistance) &&
      this.fitsWithinBounds(orientation === 'long' ? pos : 0, orientation === 'lat' ? pos : 0)
    ) {
      this.drawGridLine(
        this.makeLineCoords({
          orientation,
          pos,
          start: boundsStart,
          end: boundsEnd,
        }),
      );
      this.drawGridLineLabel(
        ddToDmsFormatted(getClosestMinute(minuteOffset)),
        orientation === 'lat' ? this.bounds.left - this.gridLabelWidth : pos,
        orientation === 'lat' ? pos : this.bounds.bottom + this.gridPadding,
      );
      pos += direction * pixelsPerMinute;
      minuteOffset += direction;
    }

    // Subdivisions
    pos = baseOffset + direction * subDivSize;
    let subIndex = direction;
    const { degrees, minutes } = ddToDms(getClosestMinute());
    const secondsPerSubdivision = 60 / (this.minuteDivisions + 1);

    while (
      Math.abs(pos) < Math.abs(maxDistance) &&
      this.fitsWithinBounds(orientation === 'long' ? pos : 0, orientation === 'lat' ? pos : 0)
    ) {
      this.drawGridSubdivisionLine(
        this.makeLineCoords({
          orientation,
          pos,
          start: boundsStart,
          end: boundsEnd,
        }),
      );

      const seconds =
        direction === 1 ? secondsPerSubdivision * subIndex : 60 + secondsPerSubdivision * subIndex;

      if (seconds > 0 && seconds < 60) {
        const label = coordsToDmsFormatted({ degrees, minutes, seconds }, 0);
        this.drawGridLineLabel(
          label,
          orientation === 'lat' ? this.bounds.left - this.gridLabelWidth : pos,
          orientation === 'lat' ? pos : this.bounds.bottom + this.gridPadding,
        );
      }

      pos += direction * subDivSize;
      subIndex += direction;
    }
  }

  private getPixelsPerSecond(axisSize: number) {
    return (axisSize / this.visibleSeconds) * this.zoom;
  }

  private drawGridAxis({
    orientation,
    getClosestMinute,
    axisSize,
    boundsStart,
    boundsEnd,
    labelAlign,
  }: {
    orientation: 'lat' | 'long';
    getClosestMinute: (offset?: number) => number;
    axisSize: number;
    boundsStart: number;
    boundsEnd: number;
    labelAlign: CanvasTextAlign;
  }) {
    this.determineMinuteDivisions(orientation);

    const pixelsPerSecond = this.getPixelsPerSecond(axisSize);
    const pixelsPerMinute = pixelsPerSecond * SECONDS_PER_MINUTE;
    const subDivSize = this.getSubDivSize(pixelsPerSecond);

    const closest = getClosestMinute();

    // Distance from center to nearest minute line
    const diff = this.diffInSeconds(closest, this.center[orientation]);
    const baseOffset =
      diff * pixelsPerSecond * (orientation === 'lat' ? Math.sign(closest - this.center.lat) : 1);

    this.context.textAlign = labelAlign;

    // Draw the main minute line
    this.drawGridLine(
      this.makeLineCoords({
        orientation,
        pos: baseOffset,
        start: boundsStart,
        end: boundsEnd,
      }),
    );

    this.drawGridLineLabel(
      ddToDmsFormatted(closest),
      orientation === 'lat' ? this.bounds.left - this.gridLabelWidth : baseOffset,
      orientation === 'lat' ? baseOffset : this.bounds.bottom + this.gridPadding,
    );

    // Draw outward in both directions
    this.drawAxisSide({
      orientation,
      baseOffset,
      pixelsPerMinute,
      subDivSize,
      direction: +1,
      getClosestMinute,
      boundsStart,
      boundsEnd,
    });

    this.drawAxisSide({
      orientation,
      baseOffset,
      pixelsPerMinute,
      subDivSize,
      direction: -1,
      getClosestMinute,
      boundsStart,
      boundsEnd,
    });
  }

  private drawGridLine({ from, to }: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 1;
      this.context.strokeStyle = gridLineColor;

      if (from && to) {
        // clear the area under the line to prevent visible overlapping lines
        this.context.clearRect(from?.x, from?.y - 1, to?.x - from?.x, 1);
      }

      this.drawLine({ from, to });
    });
  }

  private drawGridLineLabel(text: string, x: number, y: number) {
    this.drawLabel(text, x, y, gridLabelColor);
  }

  private drawGridSubdivisionLine({ from, to }: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 0.5;
      this.context.strokeStyle = subgridLabelColor;
      this.context.lineDashOffset = 1;
      this.context.setLineDash([4]);

      this.drawLine({ from, to });
    });
  }

  private drawLabel(text: string, x: number, y: number, fillStyle: string) {
    this.draw(() => {
      this.context.font = '13px system-ui';
      this.context.textBaseline = 'middle';
      this.context.fillStyle = fillStyle;
      this.context.fillText(text, Math.round(x), Math.round(y), this.gridLabelWidth);
    });
  }

  private getSubDivSize(pixelsPerSecond: number) {
    const pixelsPerMinute = pixelsPerSecond * SECONDS_PER_MINUTE;
    const pixelsPerSubDivision = pixelsPerMinute / (this.minuteDivisions + 1);
    const subDivWidth = Math.min(pixelsPerSubDivision, this.maxGridSubdivWidth);

    return Math.max(subDivWidth, this.minGridSubdivWidth);
  }

  private drawLongitudeLines() {
    this.drawGridAxis({
      orientation: 'long',
      getClosestMinute: this.closestLongMinute,
      axisSize: this.canvasWidth,
      boundsStart: this.bounds.top,
      boundsEnd: this.bounds.bottom,
      labelAlign: 'center',
    });
  }

  private drawLatitudeLines() {
    this.drawGridAxis({
      orientation: 'lat',
      getClosestMinute: this.closestLatMinute,
      axisSize: this.canvasHeight,
      boundsStart: this.bounds.left,
      boundsEnd: this.bounds.right,
      labelAlign: 'start',
    });
  }

  private fitsWithinBounds(x: number, y: number) {
    return (
      x >= this.bounds.left &&
      x <= this.bounds.right &&
      y >= this.bounds.top &&
      y <= this.bounds.bottom
    );
  }
}
