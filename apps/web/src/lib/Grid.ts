import type { Coordinate } from 'socket/types';
import type { FromTo } from '../types';
import {
  coordsToDmsFormatted,
  ddToDms,
  ddToDmsFormatted,
} from '../utils/ddToDms';
import { dmsToDd } from '../utils/dmsToDd';
import { Canvas } from './canvas';
import { SECONDS_PER_MINUTE } from './gridCoordinate';
import { gridLabelColor, gridLineColor, subgridLabelColor } from './tokens';

export class Grid extends Canvas {
  private gridPadding = 16;

  private gridLabelWidth = 80;

  private gridDivisions = 2;

  private gridLimit = {
    top: this.gridPadding,
    right: this.gridPadding,
    bottom: 32, // prevent overlap with longitude labels
    left: this.gridPadding + this.gridLabelWidth, // prevent overlap with latitude labels
  };

  private bounds = {
    top: (this.canvas.height / 2 - this.gridLimit.top) * -1,
    right: this.canvas.width / 2 - this.gridLimit.right,
    bottom: this.canvas.height / 2 - this.gridLimit.bottom,
    left: (this.canvas.width / 2 - this.gridLimit.left) * -1,
  };

  private visibleMinutes = 2;

  private visibleSeconds = this.visibleMinutes * SECONDS_PER_MINUTE;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  init() {
    this.clearCanvas();
    this.centerContext();
    this.drawGrid();
  }

  closestMinute(decimalDegrees: number, offset?: number) {
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

  closestLongMinute() {
    return this.closestMinute(this.center.long);
  }

  closestLongMinuteWithOffset(offset: number) {
    return this.closestMinute(this.center.long, offset);
  }

  closestLatMinute() {
    return this.closestMinute(this.center.lat);
  }

  closestLatMinuteWithOffset(offset: number) {
    return this.closestMinute(this.center.lat, offset);
  }

  diffInSeconds(from: number, to: number) {
    return (from - to) * 3600;
  }

  drawCrosshair() {
    this.drawInBackground(() => {
      this.context.globalAlpha = 0.5;
      this.context.strokeStyle = 'white';
      this.context.lineWidth = 0.5;
      this.context.lineDashOffset = 2;
      this.context.setLineDash([4]);

      this.drawLine({
        from: { x: 0, y: -this.canvas.height / 4 },
        to: { x: 0, y: this.canvas.height / 4 },
      });

      this.drawLine({
        from: { x: -this.canvas.width / 4, y: 0 },
        to: { x: this.canvas.width / 4, y: 0 },
      });
    });
  }

  drawGrid() {
    this.drawLongitudeLines();
    this.drawLatitudeLines();
    // this.drawCrosshair();
  }

  drawGridLine({ from, to }: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 1;
      this.context.strokeStyle = gridLineColor;

      if (from && to) {
        this.context.clearRect(from?.x, from?.y - 1, to?.x - from?.x, 1);
      }

      this.drawLine({ from, to });
    });
  }

  drawGridLineLabel(text: string, x: number, y: number) {
    this.drawLabel(text, x, y, gridLabelColor);
  }

  drawSubgridLineLabel(text: string, x: number, y: number) {
    this.context.globalAlpha = 0.7;
    this.drawLabel(text, x, y, gridLabelColor);
    this.context.globalAlpha = 1;
  }

  drawGridSubdivisionLine({ from, to }: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 0.5;
      this.context.strokeStyle = subgridLabelColor;
      this.context.lineDashOffset = 1;
      this.context.setLineDash([4]);

      this.drawLine({ from, to });
    });
  }

  drawLabel(text: string, x: number, y: number, fillStyle: string) {
    this.draw(() => {
      this.context.font = '12px system-ui';
      this.context.textBaseline = 'middle';
      this.context.fillStyle = fillStyle;
      this.context.fillText(
        text,
        Math.round(x),
        Math.round(y),
        this.gridLabelWidth,
      );
    });
  }

  drawLongitudeLines() {
    // 1. determine amount of pixels per second
    const pixelsPerSecond = this.canvas.width / this.visibleSeconds;
    const pixelsPerMinute = pixelsPerSecond * SECONDS_PER_MINUTE;

    // 2. find closest long minute (A)
    const closest = this.closestLongMinute();

    // 3. determine distance between center and A
    const xOffset =
      this.diffInSeconds(closest, this.center.long) * pixelsPerSecond;

    // 4. draw A
    this.drawGridLine({
      from: { x: xOffset, y: -this.canvas.height / 2 + this.gridLimit.top },
      to: { x: xOffset, y: this.canvas.height / 2 - this.gridLimit.bottom },
    });

    this.context.textAlign = 'center';

    this.drawGridLineLabel(
      ddToDmsFormatted(closest),
      xOffset,
      this.canvas.height / 2 - this.gridPadding,
    );

    // 5. determine distance from A to right of canvas
    const distanceToRight = this.canvas.width / 2 - xOffset;

    // 6. draw long minute lines to the right of A
    let nextLongOffset = xOffset;
    let longMinuteOffset = 0;
    while (distanceToRight > nextLongOffset + pixelsPerMinute) {
      nextLongOffset += pixelsPerMinute;
      longMinuteOffset += 1;

      if (!this.fitsWithinBounds(nextLongOffset, 0)) continue;

      this.drawGridLine({
        from: {
          x: nextLongOffset,
          y: -this.canvas.height / 2 + this.gridLimit.top,
        },
        to: {
          x: nextLongOffset,
          y: this.canvas.height / 2 - this.gridLimit.bottom,
        },
      });

      this.drawGridLineLabel(
        ddToDmsFormatted(this.closestLongMinuteWithOffset(longMinuteOffset)),
        nextLongOffset,
        this.canvas.height / 2 - this.gridPadding,
      );
    }

    // 7. draw long subdivision lines to the right
    nextLongOffset = xOffset;
    longMinuteOffset = 0;
    while (
      distanceToRight >
      nextLongOffset + pixelsPerMinute / (this.gridDivisions + 1)
    ) {
      nextLongOffset += pixelsPerMinute / (this.gridDivisions + 1);
      longMinuteOffset += 1;

      if (!this.fitsWithinBounds(nextLongOffset, 0)) continue;

      this.drawGridSubdivisionLine({
        from: {
          x: nextLongOffset,
          y: -this.canvas.height / 2 + this.gridLimit.top,
        },
        to: {
          x: nextLongOffset,
          y: this.canvas.height / 2 - this.gridLimit.bottom,
        },
      });

      const { degrees, minutes } = ddToDms(closest);
      const secondsPerSubdivision = 60 / (this.gridDivisions + 1);
      const seconds = secondsPerSubdivision * longMinuteOffset;

      if (seconds === 60 || seconds === 0) continue;

      const label = coordsToDmsFormatted(
        {
          degrees,
          minutes,
          seconds,
        },
        0,
      );

      this.drawSubgridLineLabel(
        label,
        nextLongOffset,
        this.canvas.height / 2 - this.gridPadding,
      );
    }

    // 8. determine distance from A to left side of canvas
    const distanceToLeft = (this.canvas.width - distanceToRight) * -1;

    // 9. draw long minute lines to the left of A
    let prevLongOffset = xOffset;
    longMinuteOffset = 0;
    while (distanceToLeft < prevLongOffset - pixelsPerMinute) {
      prevLongOffset -= pixelsPerMinute;
      longMinuteOffset -= 1;

      if (!this.fitsWithinBounds(prevLongOffset, 0)) continue;

      console.log({ prevLongOffset });

      this.drawGridLine({
        from: {
          x: prevLongOffset,
          y: -this.canvas.height / 2 + this.gridLimit.top,
        },
        to: {
          x: prevLongOffset,
          y: this.canvas.height / 2 - this.gridLimit.bottom,
        },
      });

      this.drawGridLineLabel(
        ddToDmsFormatted(this.closestLongMinuteWithOffset(longMinuteOffset)),
        prevLongOffset,
        this.canvas.height / 2 - this.gridPadding,
      );
    }

    // 10. draw long subdivision lines to the left
    prevLongOffset = xOffset;
    longMinuteOffset = 0;
    while (
      distanceToLeft <
      prevLongOffset - pixelsPerMinute / (this.gridDivisions + 1)
    ) {
      prevLongOffset -= pixelsPerMinute / (this.gridDivisions + 1);
      longMinuteOffset -= 1;

      if (!this.fitsWithinBounds(prevLongOffset, 0)) continue;

      this.drawGridSubdivisionLine({
        from: {
          x: prevLongOffset,
          y: -this.canvas.height / 2 + this.gridLimit.top,
        },
        to: {
          x: prevLongOffset,
          y: this.canvas.height / 2 - this.gridLimit.bottom,
        },
      });

      const { degrees, minutes } = ddToDms(closest);
      const seconds = 60 + (60 / (this.gridDivisions + 1)) * longMinuteOffset;

      if (seconds === 60 || seconds === 0) continue;

      const label = coordsToDmsFormatted(
        {
          degrees,
          minutes: minutes - 1,
          seconds,
        },
        0,
      );

      this.drawSubgridLineLabel(
        label,
        prevLongOffset,
        this.canvas.height / 2 - this.gridPadding,
      );
    }
  }

  drawLatitudeLines() {
    // 1. determine amount of pixels per second
    const pixelsPerSecond = this.canvas.height / this.visibleSeconds;
    const pixelsPerMinute = pixelsPerSecond * SECONDS_PER_MINUTE;

    // 2. find closest lat minute B
    const closest = this.closestLatMinute();

    // 3. determine distance between center and B
    const sign = Math.sign(closest - this.center.lat);
    const yOffset =
      this.diffInSeconds(closest, this.center.lat) * pixelsPerSecond * sign;

    this.context.textAlign = 'start';

    // 4. draw B
    this.drawGridLine({
      from: {
        x: -this.canvas.width / 2 + this.gridLimit.left + this.gridPadding,
        y: yOffset,
      },
      to: { x: this.canvas.width / 2 - this.gridLimit.right, y: yOffset },
    });

    this.drawGridLineLabel(
      ddToDmsFormatted(closest),
      -this.canvas.width / 2 + this.gridPadding,
      yOffset,
    );

    // 5. determine distance from B to top of canvas
    const distanceToTop = -this.canvas.height / 2 - yOffset;

    // 6. draw lat subdivion lines to the top
    let prevLatOffset = yOffset;
    let latMinutesOffset = 0;
    while (
      distanceToTop <
      prevLatOffset - pixelsPerMinute / (this.gridDivisions + 1)
    ) {
      prevLatOffset -= pixelsPerMinute / (this.gridDivisions + 1);
      latMinutesOffset -= 1;

      if (!this.fitsWithinBounds(0, prevLatOffset)) continue;

      this.drawGridSubdivisionLine({
        from: {
          x: -this.canvas.width / 2 + this.gridLimit.left + this.gridPadding,
          y: prevLatOffset,
        },
        to: {
          x: this.canvas.width / 2 - this.gridLimit.right,
          y: prevLatOffset,
        },
      });

      const { degrees, minutes } = ddToDms(closest);

      const secondsPerSubdivision = 60 / (this.gridDivisions + 1);
      const subdivisionOffsetSeconds = secondsPerSubdivision * latMinutesOffset;
      const seconds = 60 - (60 + subdivisionOffsetSeconds);

      if (seconds === 60 || seconds === 0) continue;

      const label = coordsToDmsFormatted(
        {
          degrees,
          minutes,
          seconds,
        },
        0,
      );

      this.drawSubgridLineLabel(
        label,
        -this.canvas.width / 2 + this.gridPadding,
        prevLatOffset,
      );
    }

    // 7. draw lat minute lines to the top of B
    prevLatOffset = yOffset;
    latMinutesOffset = 0;
    while (distanceToTop < prevLatOffset - pixelsPerMinute) {
      prevLatOffset -= pixelsPerMinute;
      latMinutesOffset -= 1;

      if (!this.fitsWithinBounds(0, prevLatOffset)) continue;

      this.drawGridLine({
        from: {
          x: -this.canvas.width / 2 + this.gridLimit.left + this.gridPadding,
          y: prevLatOffset,
        },
        to: {
          x: this.canvas.width / 2 - this.gridLimit.right,
          y: prevLatOffset,
        },
      });

      this.drawGridLineLabel(
        ddToDmsFormatted(this.closestLatMinuteWithOffset(latMinutesOffset)),
        -this.canvas.width / 2 + this.gridPadding,
        prevLatOffset,
      );
    }

    // 8. determine distance from B to bottom of canvas
    const distanceToBottom = this.canvas.height - distanceToTop * -1;

    // 9. draw lat minute lines to the bottom of B
    prevLatOffset = yOffset;
    latMinutesOffset = 0;
    while (
      distanceToBottom >
      prevLatOffset + pixelsPerMinute / (this.gridDivisions + 1)
    ) {
      prevLatOffset += pixelsPerMinute / (this.gridDivisions + 1);
      latMinutesOffset -= 1;

      if (!this.fitsWithinBounds(0, prevLatOffset)) continue;

      this.drawGridSubdivisionLine({
        from: {
          x: -this.canvas.width / 2 + this.gridLimit.left + this.gridPadding,
          y: prevLatOffset,
        },
        to: {
          x: this.canvas.width / 2 - this.gridLimit.right,
          y: prevLatOffset,
        },
      });

      const { degrees, minutes } = ddToDms(closest);
      const secondsPerSubdivision = 60 / (this.gridDivisions + 1);
      const subdivisionOffsetSeconds = secondsPerSubdivision * latMinutesOffset;
      const seconds = 60 + subdivisionOffsetSeconds;

      if (seconds === 60 || seconds === 0) continue;

      const label = coordsToDmsFormatted(
        {
          degrees,
          minutes,
          seconds,
        },
        0,
      );

      this.drawSubgridLineLabel(
        label,
        -this.canvas.width / 2 + this.gridPadding,
        prevLatOffset,
      );
    }

    // 10. draw lat minute lines to the bottom of B
    prevLatOffset = yOffset;
    latMinutesOffset = 0;
    while (distanceToBottom > prevLatOffset + pixelsPerMinute) {
      prevLatOffset += pixelsPerMinute;
      latMinutesOffset += 1;

      if (!this.fitsWithinBounds(0, prevLatOffset)) continue;

      this.drawGridLine({
        from: {
          x: -this.canvas.width / 2 + this.gridLimit.left + this.gridPadding,
          y: prevLatOffset,
        },
        to: {
          x: this.canvas.width / 2 - this.gridLimit.right,
          y: prevLatOffset,
        },
      });

      this.drawGridLineLabel(
        ddToDmsFormatted(this.closestLatMinuteWithOffset(latMinutesOffset)),
        -this.canvas.width / 2 + this.gridPadding,
        prevLatOffset,
      );
    }
  }

  fitsWithinBounds(x: number, y: number) {
    return (
      x >= this.bounds.left &&
      x <= this.bounds.right &&
      y >= this.bounds.top &&
      y <= this.bounds.bottom
    );
  }
}
