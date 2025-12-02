import type { FromTo, GridPoint, Orientation } from '../types';
import { SECONDS_PER_MINUTE } from '../utils/constants';
import { coordsToDmsFormatted, ddToDms, ddToDmsFormatted } from '../utils/ddToDms';
import { Canvas } from './canvas';
import { LatAxis } from './LatAxis';
import { LongAxis } from './LongAxis';
import {
  centerMarkerColor,
  gridBackgroundColor,
  gridLabelColor,
  gridLineColor,
  subgridLabelColor,
} from './tokens';

type DrawAxisSideParams = {
  orientation: Orientation;
  direction: 1 | -1;
};

type DrawGridAxisParams = {
  orientation: Orientation;
};

export class Grid extends Canvas {
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
    if (this.translationOffset.x === newOffset.x && this.translationOffset.y === newOffset.y)
      return;

    this.previousOffset = super.offset;
    this.translationOffset = newOffset;

    this.axis.lat.offset = newOffset;
    this.axis.long.offset = newOffset;
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
      axisFitsWithinBounds,
      baseOffset,
      getClosestMinute,
      labelFitsWithinBounds,
      labelOrigin,
      labelPosition,
      makeLineCoords,
      pixelsPerSecond,
      subDivSize,
    } = this.axis[orientation];

    const pixelsPerMinute = pixelsPerSecond * SECONDS_PER_MINUTE;
    let { minuteOffset } = this.axis[orientation];
    let pos = baseOffset() + direction * pixelsPerMinute;

    // Main minute lines
    while (axisFitsWithinBounds(pos)) {
      this.drawGridLine(makeLineCoords(pos));

      if (labelFitsWithinBounds(pos)) {
        const closestMinute = getClosestMinute(minuteOffset);
        const labelText = ddToDmsFormatted(closestMinute);

        this.drawLabel(labelText, labelPosition(pos), labelOrigin(pos));
      }

      pos += direction * pixelsPerMinute;
      minuteOffset += direction;
    }

    // Subdivisions
    pos = baseOffset() + direction * subDivSize;

    let subIndex = direction;
    const { degrees, minutes } = ddToDms(getClosestMinute());
    const secondsPerSubdivision = SECONDS_PER_MINUTE / (this.minuteDivisions + 1);

    while (axisFitsWithinBounds(pos)) {
      this.drawGridSubdivisionLine(makeLineCoords(pos));

      if (labelFitsWithinBounds(pos)) {
        const labelText = this.computeSubdivisionLabel({
          orientation,
          direction,
          degrees,
          minutes,
          index: subIndex,
          secondsPerSubdivision,
        });

        if (labelText) {
          this.drawLabel(labelText, labelPosition(pos), labelOrigin(pos));
        }
      }

      pos += direction * subDivSize;
      subIndex += direction;
    }
  }

  private drawGridAxis({ orientation }: DrawGridAxisParams) {
    const {
      baseOffset,
      getClosestMinute,
      labelAlign,
      labelPosition,
      labelOrigin,
      makeLineCoords,
      labelFitsWithinBounds,
    } = this.axis[orientation];

    const closest = getClosestMinute();

    this.context.textAlign = labelAlign;

    // Draw the main minute line
    this.drawGridLine(makeLineCoords(baseOffset()));

    if (labelFitsWithinBounds(baseOffset())) {
      this.drawLabel(
        ddToDmsFormatted(closest),
        labelPosition(baseOffset()),
        labelOrigin(baseOffset()),
      );
    }

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

  private drawLabel(text: string, gridPoint: GridPoint, origin?: GridPoint) {
    this.draw(() => {
      this.context.font = '12px system-ui';
      this.context.textBaseline = 'middle';
      this.context.fillStyle = gridLabelColor;

      if (origin) {
        this.draw(() => {
          this.context.fillStyle = gridBackgroundColor;
          this.context.rect(origin.x, origin.y, Canvas.LABEL_WIDTH, Canvas.LABEL_HEIGHT);
          this.context.fill();
        });
      }

      this.text({ text, gridPoint });
    });
  }

  protected fitsWithinBounds(gridPoint: GridPoint) {
    const { x, y } = gridPoint;
    return (
      x >= this.bounds.left * 10 &&
      x <= this.bounds.right * 10 &&
      y >= this.bounds.top * 10 &&
      y <= this.bounds.bottom * 10
    );
  }
}
