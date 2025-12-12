import {
  closestMinute,
  coordsToDmsFormatted,
  ddToDms,
  ddToDmsFormatted,
  diffInSeconds,
} from '@milgnss/utils';
import { SECONDS_PER_MINUTE } from '@milgnss/utils/constants';
import type { FromTo, GridPoint } from '@milgnss/utils/types';
import type { Direction } from '../types';
import { Canvas } from './Canvas';
import { GridCoordinate } from './GridCoordinate';
import { gridBackgroundColor, gridLabelColor, gridLineColor, subgridLabelColor } from './tokens';

const BOUNDS_MULTIPLIER = 10;

export abstract class GridAxis extends Canvas {
  abstract labelFitsWithinBounds: (xOrYpos: number) => boolean;
  abstract labelOrigin: (pos: number) => GridPoint;
  abstract labelPosition: (pos: number) => GridPoint;
  abstract labelX: (pos: number) => number | (() => number);
  abstract labelY: (pos: number) => number | (() => number);
  abstract makeLineCoords: (xOrYpos: number) => FromTo;

  /**
   * Decimal degrees (lat or long) of the center of the canvas
   */
  protected abstract readonly degrees: number;

  /**
   * Pixels per decimal second for this axis
   */
  protected abstract readonly pixelsPerSecond: number;

  /**
   * Size of subdivisions in pixels
   */
  protected abstract readonly subDivSize: number;

  /**
   * Returns whether the axis line at the given position fits within the current bounds of the canvas
   */
  protected abstract axisFitsWithinBounds(xOrYpos: number): boolean;

  /**
   * Returns whether DMS calculation should be inverted based on axis and direction in which the label
   * should be rendered based on the center of the canvas.
   */
  protected abstract shouldInvertDmsCalculation(direction: Direction): boolean;

  /**
   * Return true when the given grid point fits within the bounds of the grid
   */
  protected fitsWithinBounds(gridPoint: GridPoint) {
    const { x, y } = gridPoint;

    return (
      x >= this.axisBounds.left &&
      x <= this.axisBounds.right &&
      y >= this.axisBounds.top &&
      y <= this.axisBounds.bottom
    );
  }

  /**
   * Get extended axis bounds for rendering lines that go beyond the visible canvas area
   */
  protected get axisBounds() {
    return {
      top: this.bounds.top * BOUNDS_MULTIPLIER,
      right: this.bounds.right * BOUNDS_MULTIPLIER,
      bottom: this.bounds.bottom * BOUNDS_MULTIPLIER,
      left: this.bounds.left * BOUNDS_MULTIPLIER,
    };
  }

  /**
   * Get the base offset in pixels from the center to the closest whole minute mark
   */
  private get baseOffset() {
    const closest = closestMinute(this.degrees);

    const secondsToCenter = diffInSeconds(closest, this.degrees);

    return secondsToCenter * this.pixelsPerSecond * Math.sign(closest - this.degrees);
  }

  private get pixelsPerMinute() {
    return this.pixelsPerSecond * SECONDS_PER_MINUTE;
  }

  private renderGridLine(fromTo: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 1;
      this.context.strokeStyle = gridLineColor;

      const from = new GridCoordinate(fromTo.from.x, fromTo.from.y)
        .offset(this.offset)
        .zoomLevel(this.zoom).point;
      const to = new GridCoordinate(fromTo.to.x, fromTo.to.y)
        .offset(this.offset)
        .zoomLevel(this.zoom).point;

      this.drawLine({
        from,
        to,
      });
    });
  }

  private renderLabel(text: string, pos: number) {
    const labelPosition = this.labelPosition(pos);
    const labelOrigin = this.labelOrigin(pos);

    this.draw(() => {
      this.context.font = '12px system-ui';
      this.context.textBaseline = 'middle';
      this.context.fillStyle = gridLabelColor;

      this.draw(() => {
        this.context.fillStyle = gridBackgroundColor;
        this.context.rect(labelOrigin.x, labelOrigin.y, Canvas.LABEL_WIDTH, Canvas.LABEL_HEIGHT);
        this.context.fill();
      });

      this.text(text, labelPosition);
    });
  }

  private renderGridSubdivisionLine(fromTo: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 0.5;
      this.context.strokeStyle = subgridLabelColor;
      this.context.lineDashOffset = 1;
      this.context.setLineDash([4]);

      const from = new GridCoordinate(fromTo.from.x, fromTo.from.y)
        .offset(this.offset)
        .zoomLevel(this.zoom).point;

      const to = new GridCoordinate(fromTo.to.x, fromTo.to.y)
        .offset(this.offset)
        .zoomLevel(this.zoom).point;

      this.drawLine({
        from,
        to,
      });
    });
  }

  private computeSubdivisionLabel(direction: Direction, index: number) {
    const secondsPerSubdivision = SECONDS_PER_MINUTE / (this.minuteDivisions + 1);
    const { degrees, minutes } = ddToDms(this.getClosestMinute());

    let seconds = secondsPerSubdivision * index * direction;

    const invert = this.shouldInvertDmsCalculation(direction);

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

  /**
   * Render lines and labels for one side of the axis, drawing outwards from the center
   */
  private renderAxisSide(direction: Direction) {
    let minuteOffset = 0;
    let pos = this.baseOffset + direction * this.pixelsPerMinute;

    // Main minute lines
    while (this.axisFitsWithinBounds(pos)) {
      this.renderGridLine(this.makeLineCoords(pos));

      if (this.labelFitsWithinBounds(pos)) {
        const closestMinute = this.getClosestMinute(minuteOffset);
        const labelText = ddToDmsFormatted(closestMinute);

        this.renderLabel(labelText, pos);
      }

      pos += direction * this.pixelsPerMinute;
      minuteOffset += direction;
    }

    // Subdivisions
    pos = this.baseOffset + direction * this.subDivSize;
    let subIndex = direction;

    while (this.axisFitsWithinBounds(pos)) {
      this.renderGridSubdivisionLine(this.makeLineCoords(pos));

      if (this.labelFitsWithinBounds(pos)) {
        const labelText = this.computeSubdivisionLabel(direction, subIndex);

        if (labelText) {
          this.renderLabel(labelText, pos);
        }
      }

      pos += direction * this.subDivSize;
      subIndex += direction;
    }
  }

  set zoomLevel(newZoomLevel: number) {
    this.zoom = newZoomLevel;
  }

  getClosestMinute = (offset?: number) => closestMinute(this.degrees, offset);

  reset() {}

  renderAxis() {
    const closest = this.getClosestMinute();

    // Draw the main minute line
    this.renderGridLine(this.makeLineCoords(this.baseOffset));

    if (this.labelFitsWithinBounds(this.baseOffset)) {
      this.renderLabel(ddToDmsFormatted(closest), this.baseOffset);
    }

    // Draw outward in both directions
    this.renderAxisSide(-1);
    this.renderAxisSide(1);
  }
}
