import { PIXELS_PER_LAT_SECOND, SECONDS_PER_MINUTE } from '@milgnss/utils/constants';
import { ModificationsEnum, type FromTo } from '@milgnss/utils/types';
import type { Direction } from '../types';
import { Canvas } from './Canvas';
import { GridAxis } from './GridAxis';
import { GridCoordinate } from './GridCoordinate';

export class LatAxis extends GridAxis {
  pixelsPerSecond = PIXELS_PER_LAT_SECOND;
  subDivSize = (this.pixelsPerSecond * SECONDS_PER_MINUTE) / (this.minuteDivisions + 1);

  protected degrees = this.center.lat;

  labelOrigin = (pos: number) =>
    new GridCoordinate(
      this.bounds.left - Canvas.LABEL_WIDTH,
      this.labelY(pos) - Canvas.LABEL_HEIGHT / 2,
    );

  labelPosition = (pos: number) =>
    new GridCoordinate(this.bounds.left - Canvas.LABEL_WIDTH, this.labelY(pos));

  labelX = () => this.bounds.left - Canvas.LABEL_WIDTH;

  labelY = (pos: number) => this.with([ModificationsEnum.OFFSET_Y, ModificationsEnum.ZOOM], pos);

  labelFitsWithinBounds = (yPos: number) =>
    this.labelY(yPos) >= this.bounds.top &&
    this.labelY(yPos) <= this.bounds.bottom - Canvas.LABEL_HEIGHT;

  axisFitsWithinBounds = (yPos: number) => this.fitsWithinBounds({ x: 0, y: yPos });

  makeLineCoords = (yPos: number): FromTo => ({
    from: new GridCoordinate(this.axisBounds.left, yPos),
    to: new GridCoordinate(this.axisBounds.right, yPos),
  });

  shouldInvertDmsCalculation = (direction: Direction) => direction === 1;

  renderAxis() {
    this.context.textAlign = 'start';
    super.renderAxis();
  }
}
