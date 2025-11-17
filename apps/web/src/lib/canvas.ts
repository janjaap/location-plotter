import { type Coordinate } from 'socket/types';
import type { CanvasBounds, FromTo } from '../types';
import { SECONDS_PER_MINUTE } from '../utils/constants';

export const zoomLevelToFactor = (zoomLevel: number) => 1 + (zoomLevel - 1) / 2;
export const zoomFactorToLevel = (zoomFactor: number) => 1 + (zoomFactor - 1) * 2;

export abstract class Canvas {
  static CANVAS_PADDING = 10;

  static LABEL_HEIGHT = 20;

  static LABEL_WIDTH = 80;

  static VISIBLE_MINUTES = 3;

  static VISIBLE_SECONDS = Canvas.VISIBLE_MINUTES * SECONDS_PER_MINUTE;

  private zoomFactor = 1;

  protected canvas: HTMLCanvasElement;

  protected center: Coordinate;

  protected context!: CanvasRenderingContext2D;

  protected minuteDivisions = 1;

  constructor(center: Coordinate, canvas: HTMLCanvasElement, zoomLevel = 1) {
    this.center = center;
    this.canvas = canvas;

    this.zoomFactor = zoomLevelToFactor(zoomLevel);
    this.minuteDivisions = zoomLevel;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get 2D canvas context');
    }

    this.context = context as CanvasRenderingContext2D;
    this.context.textRendering = 'optimizeLegibility';
  }

  get canvasHeight() {
    return this.canvas.height;
  }

  get canvasWidth() {
    return this.canvas.width;
  }

  get bounds(): CanvasBounds {
    return {
      top: (this.canvasHeight / 2 - Canvas.CANVAS_PADDING) * -1,
      right: this.canvasWidth / 2 - Canvas.CANVAS_PADDING,
      bottom: this.canvasHeight / 2 - Canvas.LABEL_HEIGHT,
      left: (this.canvasWidth / 2 - Canvas.CANVAS_PADDING - Canvas.LABEL_WIDTH) * -1,
    };
  }

  get zoom() {
    return this.zoomFactor;
  }

  set zoom(zoomLevel: number) {
    this.zoomFactor = zoomLevelToFactor(zoomLevel);
    this.minuteDivisions = zoomLevel;
  }

  protected getPixelsPerLongSecond(zoomLevel = this.zoom) {
    return this.getPixelsPerSecond(
      this.bounds.right - this.bounds.left,
      Canvas.VISIBLE_SECONDS,
      zoomLevel,
    );
  }

  protected getPixelsPerLatSecond(zoomLevel = this.zoom) {
    return this.getPixelsPerSecond(
      this.bounds.bottom - this.bounds.top,
      Canvas.VISIBLE_SECONDS,
      zoomLevel,
    );
  }

  private getPixelsPerSecond(pixels: number, seconds: number, zoomLevel = this.zoom) {
    return (pixels / seconds) * zoomLevel;
  }

  protected reset() {
    this.clearCanvas();
    this.centerContext();
  }

  private centerContext() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
  }

  private clearCanvas() {
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

  drawCircle(x: number, y: number, radius: number, appearance: 'fill' | 'stroke') {
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

  teardown() {}
}
