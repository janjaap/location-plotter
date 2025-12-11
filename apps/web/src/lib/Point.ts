import { zoomLevelToFactor } from '@milgnss/utils';
import type { GridPoint } from '@milgnss/utils/types';

export class Point {
  translationOffset: GridPoint = { x: 0, y: 0 };
  zoomFactor = 1;

  offset(newOffset: GridPoint) {
    this.translationOffset = newOffset;
    return this;
  }

  zoomLevel(zoomLevel: number) {
    this.zoomFactor = zoomLevelToFactor(zoomLevel);
    return this;
  }

  protected withZoom = (gridPoint: GridPoint): GridPoint => ({
    x: gridPoint.x * this.zoomFactor,
    y: gridPoint.y * this.zoomFactor,
  });

  protected withOffset = (gridPoint: GridPoint): GridPoint => ({
    x: gridPoint.x + this.translationOffset.x,
    y: gridPoint.y + this.translationOffset.y,
  });
}
