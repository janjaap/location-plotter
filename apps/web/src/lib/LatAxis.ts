import type { FromTo } from '../types';
import { SECONDS_PER_MINUTE } from '../utils/constants';
import { Canvas } from './canvas';
import { GridAxis } from './GridAxis';

export class LatAxis extends GridAxis {
  labelAlign = 'start' as CanvasTextAlign;
  minuteOffset = -1;
  pixelsPerSecond = Canvas.PIXELS_PER_LAT_SECOND;
  subDivSize = (this.pixelsPerSecond * SECONDS_PER_MINUTE) / (this.minuteDivisions + 1);

  protected degrees = this.center.lat;

  labelOrigin = (pos: number) => ({
    x: this.bounds.left - Canvas.LABEL_WIDTH,
    y: this.withOffsetY(pos) - Canvas.LABEL_HEIGHT / 2,
  });

  labelPosition = (pos: number) => ({
    x: this.bounds.left - Canvas.LABEL_WIDTH,
    y: this.withOffsetY(pos),
  });

  labelX = () => this.bounds.left - Canvas.LABEL_WIDTH;

  labelY = (pos: number) => this.withOffsetY(pos);

  labelFitsWithinBounds = (yPos: number) =>
    this.labelY(yPos) >= this.bounds.top &&
    this.labelY(yPos) <= this.bounds.bottom - Canvas.LABEL_HEIGHT;

  axisFitsWithinBounds = (yPos: number) => this.fitsWithinBounds({ x: 0, y: yPos });

  makeLineCoords = (yPos: number): FromTo => ({
    from: { x: this.axisBounds.left, y: yPos },
    to: { x: this.axisBounds.right, y: yPos },
  });
}
