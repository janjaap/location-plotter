import { type Coordinate } from 'socket/types';
import type { FromTo } from '../types';
import { gridCoordinate } from './gridCoordinate';

export abstract class Canvas {
  static DEFAULT_ZOOM_LEVEL = 10;
  static MAX_VISIBLE_DEGREES_LAT = 3;
  static MAX_VISIBLE_DEGREES_LONG = 3;

  protected canvas: HTMLCanvasElement | OffscreenCanvas;

  protected context!:
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  // protected zoomLevel = Canvas.DEFAULT_ZOOM_LEVEL;

  /**
   * Starting location and center of the geographical area
   */
  protected center: Coordinate;

  zoomLevel = Canvas.DEFAULT_ZOOM_LEVEL;

  subdivisions = this.zoomLevel;

  constructor(center: Coordinate, canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.center = center;
    this.canvas = canvas;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get 2D canvas context');
    }

    this.context = context as CanvasRenderingContext2D;
    this.context.textRendering = 'geometricPrecision';
  }

  get gridColumnWidth() {
    return (
      (this.canvas.width / Canvas.MAX_VISIBLE_DEGREES_LONG) * this.zoomLevel
    );
  }

  get gridRowHeight() {
    return (
      (this.canvas.height / Canvas.MAX_VISIBLE_DEGREES_LAT) * this.zoomLevel
    );
  }

  centerContext(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;

    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
  }

  clearCanvas() {
    this.context.rotate(0);
    this.context.beginPath();
    this.context.clearRect(
      -this.canvas.width / 2,
      -this.canvas.height / 2,
      this.canvas.width,
      this.canvas.height,
    );
  }

  draw(drawFunc: () => void) {
    this.context.save();

    drawFunc();

    this.context.restore();
  }

  drawCircle(
    x: number,
    y: number,
    radius: number,
    appearance: 'fill' | 'stroke',
  ) {
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    this.context.closePath();

    if (appearance === 'fill') {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  }

  drawInBackground(drawFunc: () => void) {
    this.context.save();
    this.context.globalCompositeOperation = 'destination-over';

    this.draw(drawFunc);

    this.context.restore();
  }

  drawLine({ from, to }: FromTo) {
    this.context.beginPath();
    if (from) this.context.moveTo(Math.round(from.x), Math.round(from.y));
    this.context.lineTo(Math.round(to.x), Math.round(to.y));
    this.context.closePath();
    this.context.stroke();
  }

  getGridCoordinate = (point: Coordinate) =>
    gridCoordinate(
      point,
      this.center,
      this.gridColumnWidth,
      this.gridRowHeight,
    );

  teardown() {}
}
