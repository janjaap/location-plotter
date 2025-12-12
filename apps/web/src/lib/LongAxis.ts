import { PIXELS_PER_LONG_SECOND, SECONDS_PER_MINUTE } from '@milgnss/utils/constants';
import { ModificationsEnum, type FromTo } from '@milgnss/utils/types';
import type { Direction } from '../types';
import { Canvas } from './Canvas';
import { GridAxis } from './GridAxis';
import { GridCoordinate } from './GridCoordinate';

export class LongAxis extends GridAxis {
  pixelsPerSecond = PIXELS_PER_LONG_SECOND;
  subDivSize = (this.pixelsPerSecond * SECONDS_PER_MINUTE) / (this.minuteDivisions + 1);

  protected degrees = this.center.long;

  labelOrigin = (pos: number) =>
    new GridCoordinate(this.labelX(pos) - Canvas.LABEL_WIDTH / 2, this.bounds.bottom);

  labelPosition = (pos: number) => new GridCoordinate(this.labelX(pos), this.labelY());

  labelX = (xPos: number) => this.with([ModificationsEnum.OFFSET_X, ModificationsEnum.ZOOM], xPos);

  labelY = () => this.bounds.bottom + Canvas.CANVAS_PADDING;

  labelFitsWithinBounds = (xPos: number) =>
    this.labelX(xPos) >= this.bounds.left - Canvas.LABEL_WIDTH / 2 &&
    this.labelX(xPos) <= this.bounds.right - Canvas.LABEL_WIDTH / 2;

  axisFitsWithinBounds = (xPos: number) => this.fitsWithinBounds({ x: xPos, y: 0 });

  makeLineCoords = (xPos: number): FromTo => ({
    from: new GridCoordinate(xPos, this.axisBounds.top),
    to: new GridCoordinate(xPos, this.axisBounds.bottom),
  });

  shouldInvertDmsCalculation = (direction: Direction) => direction === -1;

  renderAxis() {
    this.context.textAlign = 'center';
    super.renderAxis();
  }
}
