import { SECONDS_PER_MINUTE } from '@milgnss/utils/constants';
import type { FromTo } from '@milgnss/utils/types';
import { Canvas } from './canvas';
import { GridAxis } from './GridAxis';

export class LongAxis extends GridAxis {
  labelAlign = 'center' as CanvasTextAlign;
  minuteOffset = 1;
  pixelsPerSecond = Canvas.PIXELS_PER_LONG_SECOND;
  subDivSize = (this.pixelsPerSecond * SECONDS_PER_MINUTE) / (this.minuteDivisions + 1);

  protected degrees = this.center.long;

  labelOrigin = (pos: number) => ({
    x: this.labelX(pos) - Canvas.LABEL_WIDTH / 2,
    y: this.bounds.bottom,
  });

  labelPosition = (pos: number) => ({
    x: this.labelX(pos),
    y: this.labelY(),
  });

  labelX = (xPos: number) => this.withOffsetX(xPos);

  labelY = () => this.bounds.bottom + Canvas.CANVAS_PADDING;

  labelFitsWithinBounds = (xPos: number) =>
    this.labelX(xPos) >= this.bounds.left - Canvas.LABEL_WIDTH / 2 &&
    this.labelX(xPos) <= this.bounds.right - Canvas.LABEL_WIDTH / 2;

  axisFitsWithinBounds = (xPos: number) => this.fitsWithinBounds({ x: xPos, y: 0 });

  makeLineCoords = (xPos: number): FromTo => ({
    from: { x: xPos, y: this.axisBounds.top },
    to: { x: xPos, y: this.axisBounds.bottom },
  });
}
