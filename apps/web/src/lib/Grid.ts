import { ServerEvents } from 'socket/types';
import type { FromTo } from '../types';
import { SECONDS_PER_MINUTE } from '../utils/constants';
import { coordsToDmsFormatted, ddToDms, ddToDmsFormatted } from '../utils/ddToDms';
import { dmsToDd } from '../utils/dmsToDd';
import { Canvas } from './canvas';
import { clientSocket } from './clientSocket';
import { Observable } from './Obserservable';
import { centerMarkerColor, gridLabelColor, gridLineColor, subgridLabelColor } from './tokens';

type Orientation = 'lat' | 'long';

type DrawAxisSideParams = {
  orientation: Orientation;
  baseOffset: number;
  pixelsPerMinute: number;
  subDivSize: number;
  direction: 1 | -1;
  getClosestMinute: (offset?: number) => number;
  boundsStart: number;
  boundsEnd: number;
};

type MakeLineCoordsParams = {
  orientation: Orientation;
  pos: number;
  start: number;
  end: number;
};

export class Grid extends Observable {
  constructor(...args: ConstructorParameters<typeof Canvas>) {
    super(...args);

    this.init();
  }

  get zoom() {
    return super.zoom;
  }

  set zoom(zoomLevel: number) {
    super.zoom = zoomLevel;

    this.drawGrid();
  }

  private init() {
    this.resizeObserver(this.drawGrid);
    this.drawGrid();

    clientSocket.on(ServerEvents.RESET, this.onExternalReset);
  }

  private onExternalReset = () => {
    this.reset();
    this.drawGrid();
  };

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

  private drawGrid = () => {
    this.reset();
    this.drawBounds();
    this.drawCenterMarker();
    this.drawLongitudeLines();
    this.drawLatitudeLines();
  };

  private drawBounds() {
    this.draw(() => {
      const margin = 100;
      const left = this.bounds.left;
      const top = this.bounds.top;
      const width = this.bounds.right - this.bounds.left;
      const height = this.bounds.bottom - this.bounds.top;

      console.log(this.zoom);

      for (let i = 0; i <= 4; i++) {
        this.context.rect(left, top, width, height);
        this.context.fillStyle = 'rgba(255, 255, 255, 0.01)';
        this.context.fill();

        this.context.clearRect(
          left + margin * i,
          top + margin * i,
          width - margin * i * 2,
          height - margin * i * 2,
        );
      }
    });
  }

  private drawCenterMarker() {
    this.draw(() => {
      this.context.fillStyle = centerMarkerColor;
      this.drawCircle(0, 0, 3, 'fill');
    });
  }

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
    let minuteOffset = orientation === 'lat' ? -direction : direction;
    let pos = baseOffset + direction * pixelsPerMinute;

    // Main minute lines
    while (
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
        orientation === 'lat' ? this.bounds.left - Canvas.LABEL_WIDTH : pos,
        orientation === 'lat' ? pos : this.bounds.bottom + Canvas.CANVAS_PADDING,
      );

      pos += direction * pixelsPerMinute;
      minuteOffset += orientation === 'lat' ? -direction : direction;
    }

    // Subdivisions
    pos = baseOffset + direction * subDivSize;

    let subIndex = direction;
    const { degrees, minutes } = ddToDms(getClosestMinute());
    const secondsPerSubdivision = SECONDS_PER_MINUTE / (this.minuteDivisions + 1);

    while (
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

      let seconds = secondsPerSubdivision * subIndex * direction;

      if (
        (orientation === 'lat' && direction === 1) ||
        (orientation === 'long' && direction === -1)
      ) {
        seconds = SECONDS_PER_MINUTE - seconds;
      }

      if (seconds !== SECONDS_PER_MINUTE && seconds !== 0) {
        let minutesAdjustment =
          (orientation === 'lat' && direction === 1) || (orientation === 'long' && direction === -1)
            ? -1
            : 0;

        if (seconds > SECONDS_PER_MINUTE) {
          minutesAdjustment +=
            (orientation === 'lat' && direction === 1) ||
            (orientation === 'long' && direction === -1)
              ? -1
              : 1;
          seconds -= SECONDS_PER_MINUTE;
        }

        if (seconds < 0) {
          minutesAdjustment -= 1;
          seconds += SECONDS_PER_MINUTE;
        }

        const label = coordsToDmsFormatted(
          { degrees, minutes: minutes + minutesAdjustment, seconds },
          0,
        );

        this.drawGridLineLabel(
          label,
          orientation === 'lat' ? this.bounds.left - Canvas.LABEL_WIDTH : pos,
          orientation === 'lat' ? pos : this.bounds.bottom + Canvas.CANVAS_PADDING,
        );
      }

      pos += direction * subDivSize;
      subIndex += direction;
    }
  }

  private drawGridAxis({
    orientation,
    getClosestMinute,
    boundsStart,
    boundsEnd,
    labelAlign,
  }: {
    orientation: 'lat' | 'long';
    getClosestMinute: (offset?: number) => number;
    boundsStart: number;
    boundsEnd: number;
    labelAlign: CanvasTextAlign;
  }) {
    const pixelsPerSecond =
      orientation === 'lat' ? this.getPixelsPerLatSecond() : this.getPixelsPerLongSecond();
    const pixelsPerMinute = pixelsPerSecond * SECONDS_PER_MINUTE;
    const subDivSize = pixelsPerMinute / (this.minuteDivisions + 1);

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
      orientation === 'lat' ? this.bounds.left - Canvas.LABEL_WIDTH : baseOffset,
      orientation === 'lat' ? baseOffset : this.bounds.bottom + Canvas.CANVAS_PADDING,
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
      this.context.font = '12px system-ui';
      this.context.textBaseline = 'middle';
      this.context.fillStyle = fillStyle;
      this.context.fillText(text, Math.round(x), Math.round(y), Canvas.LABEL_WIDTH);
    });
  }

  private drawLongitudeLines() {
    this.drawGridAxis({
      orientation: 'long',
      getClosestMinute: this.closestLongMinute,
      boundsStart: this.bounds.top,
      boundsEnd: this.bounds.bottom,
      labelAlign: 'center',
    });
  }

  private drawLatitudeLines() {
    this.drawGridAxis({
      orientation: 'lat',
      getClosestMinute: this.closestLatMinute,
      boundsStart: this.bounds.left,
      boundsEnd: this.bounds.right,
      labelAlign: 'start',
    });
  }

  private fitsWithinBounds(x: number, y: number) {
    return (
      x >= this.bounds.left + Canvas.LABEL_WIDTH / 2 &&
      x <= this.bounds.right - Canvas.LABEL_WIDTH / 2 &&
      y >= this.bounds.top &&
      y <= this.bounds.bottom
    );
  }

  teardown() {
    clientSocket.off(ServerEvents.RESET, this.onExternalReset);

    super.teardown();
  }
}
