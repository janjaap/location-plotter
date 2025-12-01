import type { FromTo, GridPoint } from '../types';
import { SECONDS_PER_MINUTE } from '../utils/constants';
import { coordsToDmsFormatted, ddToDms, ddToDmsFormatted } from '../utils/ddToDms';
import { closestMinute, diffInSeconds } from '../utils/minutes';
import { Canvas } from './canvas';
import { centerMarkerColor, gridLabelColor, gridLineColor, subgridLabelColor } from './tokens';

type Orientation = 'lat' | 'long';

type DrawAxisSideParams = {
  orientation: Orientation;
  direction: 1 | -1;
};

type DrawGridAxisParams = {
  orientation: 'lat' | 'long';
};

export class Grid extends Canvas {
  private ORIENTATION = {
    lat: {
      baseOffset: () => {
        const closest = this.ORIENTATION.lat.getClosestMinute();

        // Distance from center to nearest minute line
        const diff = this.ORIENTATION.lat.secondsToCenter(closest);
        return diff * this.ORIENTATION.lat.pixelsPerSecond * Math.sign(closest - this.center.lat);
      },
      boundsEnd: this.bounds.right * 10,
      boundsStart: this.bounds.left * 10,
      fitsWithinBounds: (yPos: number) => this.fitsWithinBounds(0, yPos),
      getClosestMinute: (offset?: number) => closestMinute(this.center.lat, offset),
      labelAlign: 'start' as CanvasTextAlign,
      labelFitsWithinBounds: (yPos: number) =>
        this.ORIENTATION.lat.labelY(yPos) >= this.bounds.top &&
        this.ORIENTATION.lat.labelY(yPos) <= this.bounds.bottom - Canvas.LABEL_HEIGHT,
      labelPosition: (pos: number) => ({
        x: this.bounds.left - Canvas.LABEL_WIDTH,
        y: this.withOffsetY(pos),
      }),
      labelX: () => this.bounds.left - Canvas.LABEL_WIDTH,
      labelY: (pos: number) => this.withOffsetY(pos),
      makeLineCoords: (yPos: number): FromTo => ({
        from: { x: this.ORIENTATION.lat.boundsStart, y: yPos },
        to: { x: this.ORIENTATION.lat.boundsEnd, y: yPos },
      }),
      minuteOffset: -1,
      pixelsPerSecond: Canvas.PIXELS_PER_LAT_SECOND,
      secondsToCenter: (decimalDegrees: number) => diffInSeconds(decimalDegrees, this.center.lat),
      subDivSize: (Canvas.PIXELS_PER_LAT_SECOND * SECONDS_PER_MINUTE) / (this.minuteDivisions + 1),
    },
    long: {
      baseOffset: () => {
        const closest = this.ORIENTATION.long.getClosestMinute();

        // Distance from center to nearest minute line
        const diff = this.ORIENTATION.long.secondsToCenter(closest);
        return diff * this.ORIENTATION.long.pixelsPerSecond * Math.sign(closest - this.center.long);
      },
      boundsEnd: this.bounds.bottom * 10,
      boundsStart: this.bounds.top * 10,
      fitsWithinBounds: (xPos: number) => this.fitsWithinBounds(xPos, 0),
      getClosestMinute: (offset?: number) => closestMinute(this.center.long, offset),
      labelFitsWithinBounds: (xPos: number) =>
        this.ORIENTATION.long.labelX(xPos) >= this.bounds.left - Canvas.LABEL_WIDTH / 2 &&
        this.ORIENTATION.long.labelX(xPos) <= this.bounds.right - Canvas.LABEL_WIDTH / 2,
      labelAlign: 'center' as CanvasTextAlign,
      labelPosition: (pos: number) => ({
        x: this.withOffsetX(pos) - Canvas.LABEL_WIDTH / 2,
        y: this.bounds.bottom + Canvas.CANVAS_PADDING,
      }),
      labelX: (pos: number) => this.withOffsetX(pos),
      labelY: () => this.bounds.bottom + Canvas.CANVAS_PADDING,
      makeLineCoords: (xPos: number): FromTo => ({
        from: { x: xPos, y: this.ORIENTATION.long.boundsStart },
        to: { x: xPos, y: this.ORIENTATION.long.boundsEnd },
      }),
      minuteOffset: 1,
      pixelsPerSecond: Canvas.PIXELS_PER_LONG_SECOND,
      secondsToCenter: (decimalDegrees: number) => diffInSeconds(decimalDegrees, this.center.long),
      subDivSize: (Canvas.PIXELS_PER_LONG_SECOND * SECONDS_PER_MINUTE) / (this.minuteDivisions + 1),
    },
  } as const;

  constructor(...args: ConstructorParameters<typeof Canvas>) {
    super(...args);

    this.init();
  }

  get offset() {
    return super.offset;
  }

  set offset(newOffset: GridPoint) {
    if (this.translationOffset.x === newOffset.x && this.translationOffset.y === newOffset.y)
      return;

    this.previousOffset = super.offset;
    this.translationOffset = newOffset;

    this.drawGrid(true);
  }

  private init() {
    this.centerContext();
    this.drawGrid();
  }

  drawGrid = (performFullReset = false) => {
    if (performFullReset) {
      this.reset();
    }

    this.drawGridAxis({
      orientation: 'lat',
    });

    this.drawGridAxis({
      orientation: 'long',
    });

    this.drawCenterMarker();
  };

  private drawCenterMarker() {
    const markerRadius = 10;
    const markerLineWidth = 1;

    this.draw(() => {
      this.context.fillStyle = centerMarkerColor;
      this.drawCircle(this.withOffset({ x: 0, y: 0 }), markerRadius + 2, 'fill');

      this.context.lineWidth = markerLineWidth;
      this.context.strokeStyle = '#820101';
      this.context.stroke();
    });
  }

  private computeSubdivisionLabel({
    orientation,
    direction,
    degrees,
    minutes,
    index,
    secondsPerSubdivision,
  }: {
    orientation: Orientation;
    direction: 1 | -1;
    degrees: number;
    minutes: number;
    index: number;
    secondsPerSubdivision: number;
  }) {
    let seconds = secondsPerSubdivision * index * direction;

    const invert =
      (orientation === 'lat' && direction === 1) || (orientation === 'long' && direction === -1);

    if (invert) seconds = SECONDS_PER_MINUTE - seconds;

    if (seconds === 0 || seconds === SECONDS_PER_MINUTE) return null;

    let minutesAdj = invert ? -1 : 0;

    if (seconds > SECONDS_PER_MINUTE) {
      minutesAdj += invert ? -1 : 1;
      seconds -= SECONDS_PER_MINUTE;
    }

    if (seconds < 0) {
      minutesAdj -= 1;
      seconds += SECONDS_PER_MINUTE;
    }

    return coordsToDmsFormatted({ degrees, minutes: minutes + minutesAdj, seconds }, 0);
  }

  private drawAxisSide({ orientation, direction }: DrawAxisSideParams) {
    const {
      baseOffset,
      fitsWithinBounds,
      getClosestMinute,
      labelFitsWithinBounds,
      labelPosition,
      makeLineCoords,
      pixelsPerSecond,
      subDivSize,
    } = this.ORIENTATION[orientation];

    const pixelsPerMinute = pixelsPerSecond * SECONDS_PER_MINUTE;
    let { minuteOffset } = this.ORIENTATION[orientation];
    let pos = baseOffset() + direction * pixelsPerMinute;

    // Main minute lines
    while (fitsWithinBounds(pos)) {
      this.drawGridLine(makeLineCoords(pos));

      const closestMinute = getClosestMinute(minuteOffset);
      const lineLabel = ddToDmsFormatted(closestMinute);

      this.drawLabel(lineLabel, labelPosition(pos));

      pos += direction * pixelsPerMinute;
      minuteOffset += direction;
    }

    // Subdivisions
    pos = baseOffset() + direction * subDivSize;

    let subIndex = direction;
    const { degrees, minutes } = ddToDms(getClosestMinute());
    const secondsPerSubdivision = SECONDS_PER_MINUTE / (this.minuteDivisions + 1);

    while (fitsWithinBounds(pos)) {
      this.drawGridSubdivisionLine(makeLineCoords(pos));

      const label = this.computeSubdivisionLabel({
        orientation,
        direction,
        degrees,
        minutes,
        index: subIndex,
        secondsPerSubdivision,
      });

      if (label && labelFitsWithinBounds(pos)) {
        this.drawLabel(label, labelPosition(pos));
      }

      pos += direction * subDivSize;
      subIndex += direction;
    }
  }

  private drawGridAxis({ orientation }: DrawGridAxisParams) {
    const { baseOffset, getClosestMinute, labelAlign, labelPosition, makeLineCoords } =
      this.ORIENTATION[orientation];

    const closest = getClosestMinute();

    // this.context.textAlign = labelAlign;

    // Draw the main minute line
    this.drawGridLine(makeLineCoords(baseOffset()));

    this.drawLabel(ddToDmsFormatted(closest), labelPosition(baseOffset()));

    // Draw outward in both directions
    this.drawAxisSide({
      orientation,
      direction: +1,
    });

    this.drawAxisSide({
      orientation,
      direction: -1,
    });
  }

  private drawGridLine({ from, to }: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 1;
      this.context.strokeStyle = gridLineColor;

      this.drawLine({ from: this.withOffset(from), to: this.withOffset(to) });
    });
  }

  private drawGridSubdivisionLine({ from, to }: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 0.5;
      this.context.strokeStyle = subgridLabelColor;
      this.context.lineDashOffset = 1;
      this.context.setLineDash([4]);

      this.drawLine({ from: this.withOffset(from), to: this.withOffset(to) });
    });
  }

  private drawLabel(text: string, gridPoint: GridPoint) {
    this.draw(() => {
      this.context.font = '12px system-ui';
      this.context.textBaseline = 'middle';
      this.context.fillStyle = gridLabelColor;

      this.text({ text, gridPoint, clearBefore: true });
    });
  }

  private fitsWithinBounds(x: number, y: number) {
    return (
      x >= this.bounds.left * 10 &&
      x <= this.bounds.right * 10 &&
      y >= this.bounds.top * 10 &&
      y <= this.bounds.bottom * 10
    );
  }
}
