import { zoomLevelToFactor } from '@milgnss/utils';
import {
  ModificationsEnum,
  type CanvasBounds,
  type Coordinate,
  type FromTo,
  type GridPoint,
  type PositionPayload,
} from '@milgnss/utils/types';

export abstract class Canvas {
  /**
   * Padding around the canvas in pixels
   */
  static CANVAS_PADDING = 10;

  /**
   * Latitude/Longitude label height in pixels
   */
  static LABEL_HEIGHT = 20;

  /**
   * Latitude/Longitude label width in pixels
   */
  static LABEL_WIDTH = 80;

  /**
   * Maximum offset in pixels in any direction (x or y)
   */
  static OFFSET_CLAMP = 1_024;

  private canvas: HTMLCanvasElement;

  /**
   * Offset in pixels applied to all drawings on the canvas
   */
  private translationOffset: GridPoint = { x: 0, y: 0 };

  /**
   * Starting coordinate at the center of the canvas
   */
  protected center: Coordinate;

  protected context!: CanvasRenderingContext2D;

  protected minuteDivisions = 5;

  protected zoom = 1;

  public abstract set zoomLevel(newZoomLevel: number);
  public abstract reset({ position, heading, speed }: PositionPayload): void;

  static validOffset(offset: GridPoint) {
    return (
      offset.x > -Canvas.OFFSET_CLAMP &&
      offset.x < Canvas.OFFSET_CLAMP &&
      offset.y > -Canvas.OFFSET_CLAMP &&
      offset.y < Canvas.OFFSET_CLAMP
    );
  }

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    this.center = center;
    this.canvas = canvas;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get 2D canvas context');
    }

    this.context = context as CanvasRenderingContext2D;
    this.context.textRendering = 'optimizeLegibility';
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

  get offset(): GridPoint {
    return this.translationOffset;
  }

  set offset(newOffset: GridPoint) {
    if (!Canvas.validOffset(newOffset)) {
      return;
    }

    this.translationOffset = newOffset;
  }

  get canvasHeight() {
    return this.canvas.height;
  }

  get canvasWidth() {
    return this.canvas.width;
  }

  get absoluteBounds(): CanvasBounds {
    return {
      top: (this.canvasHeight / 2) * -1,
      right: this.canvasWidth / 2,
      bottom: this.canvasHeight / 2,
      left: (this.canvasWidth / 2) * -1,
    };
  }

  get bounds(): CanvasBounds {
    return {
      top: (this.canvasHeight / 2 - Canvas.CANVAS_PADDING) * -1,
      right: this.canvasWidth / 2 - Canvas.CANVAS_PADDING,
      bottom: this.canvasHeight / 2 - Canvas.LABEL_HEIGHT,
      left: (this.canvasWidth / 2 - Canvas.CANVAS_PADDING - Canvas.LABEL_WIDTH) * -1,
    };
  }

  /**
   * Cap the given position to be within the canvas bounds
   */
  protected cap(position: GridPoint, margin = 0): GridPoint {
    const { x, y } = position;
    const { top, right, bottom, left } = this.absoluteBounds;

    return {
      x: Math.min(Math.max(x, left - margin), right - margin),
      y: Math.min(Math.max(y, top - margin), bottom - margin),
    };
  }

  /**
   * Render text at the given grid point
   */
  protected text(text: string, position: GridPoint) {
    const x = Math.round(position.x);
    const y = Math.round(position.y);

    this.context.fillText(text, x, y, Canvas.LABEL_WIDTH);
  }

  /**
   * Clear an area of the canvas
   */
  protected clearRect(gridPoint: GridPoint, width: number, height: number) {
    const { x, y } = gridPoint;

    const fromX = Math.round(x);
    const fromY = Math.round(y);

    this.context.clearRect(fromX, fromY, width, height);
  }

  /**
   * Clear an area of the canvas that contains a drawn object
   * To be used for objects that traverse the canvas
   */
  protected clearDirty(gridPoint: GridPoint, radius: number) {
    const { x, y } = gridPoint;

    const fromX = Math.round(x);
    const fromY = Math.round(y);

    this.context.clearRect(fromX - radius, fromY - radius, radius * 2, radius * 2);
  }

  protected clipRect(gridPoint: GridPoint, width: number, height: number) {
    const { x, y } = gridPoint;

    const fromX = Math.round(x);
    const fromY = Math.round(y);

    this.context.rect(fromX - width, fromY - height, width * 2, height * 2);
    this.context.clip();
  }

  protected clip({ x, y }: GridPoint, radius: number) {
    const fromX = Math.round(x);
    const fromY = Math.round(y);

    this.context.rect(fromX - radius, fromY - radius, radius * 2, radius * 2);
    this.context.clip();
  }

  /**
   * Restore the canvas to its initial state by clearing it and centering the context
   */
  protected resetCanvas() {
    this.clearCanvas();
    this.centerContext();
  }

  /**
   * Center the canvas context origin to the center of the canvas
   */
  protected centerContext() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
  }

  /**
   * Drawing wrapper that saves and restores the canvas context state
   */
  protected draw(drawFunc: () => void) {
    this.context.save();

    drawFunc();

    this.context.restore();
  }

  /**
   * Draw circle at the given grid point
   * To be called within a draw() wrapper
   */
  protected drawCircle({ x, y }: GridPoint, radius: number, appearance: 'fill' | 'stroke') {
    const centerX = Math.round(x);
    const centerY = Math.round(y);

    this.context.beginPath();
    this.context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.context.closePath();

    if (appearance === 'fill') {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  }

  /**
   * Draw semi-circle at the given grid point
   * To be called within a draw() wrapper
   */
  protected drawSemiCircle(
    { x, y }: GridPoint,
    radius: number,
    appearance: 'fill' | 'stroke',
    rotation = 0,
  ) {
    const centerX = Math.round(x);
    const centerY = Math.round(y);
    const starAngle = (rotation * Math.PI) / 180;
    const endAngle = Math.PI + (rotation * Math.PI) / 180;

    this.context.beginPath();
    this.context.arc(centerX, centerY, radius, starAngle, endAngle);
    this.context.closePath();

    if (appearance === 'fill') {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  }

  /**
   * Drawing wrapper that saves and restores the canvas context state
   * Renders in the background (below existing drawings)
   */
  protected drawInBackground(drawFunc: () => void) {
    this.context.save();
    this.context.globalCompositeOperation = 'destination-over';

    this.draw(drawFunc);

    this.context.restore();
  }

  /**
   * Draw line from one grid point to another
   * To be called within a draw() wrapper
   */
  protected drawLine({ from, to }: FromTo, clearBefore = false) {
    const fromX = Math.round(from.x);
    const fromY = Math.round(from.y);
    const toX = Math.round(to.x);
    const toY = Math.round(to.y);

    if (clearBefore) {
      const width = Math.abs(fromX - toX);
      const height = Math.abs(fromY - toY);

      this.context.clearRect(fromX, fromY, width, height);
    }

    this.context.beginPath();
    this.context.moveTo(fromX, fromY);
    this.context.lineTo(toX, toY);
    this.context.closePath();
    this.context.stroke();
  }

  protected with(modifications: ModificationsEnum[], value: number): number;
  protected with(modifications: ModificationsEnum[], value: GridPoint): GridPoint;
  protected with(
    modifications: ModificationsEnum[],
    value: number | GridPoint,
  ): number | GridPoint {
    let result = value;

    if (typeof result === 'number') {
      if (modifications.includes(ModificationsEnum.OFFSET_X)) {
        result = this.withOffsetX(result);
      }

      if (modifications.includes(ModificationsEnum.OFFSET_Y)) {
        result = this.withOffsetY(result);
      }
    } else {
      if (modifications.includes(ModificationsEnum.OFFSET)) {
        result = this.withOffset(result);
      }
    }

    if (modifications.includes(ModificationsEnum.ZOOM)) {
      if (typeof result === 'number') {
        result = this.withZoomFactor(result);
      } else {
        result = this.withZoomFactor(result);
      }
    }

    return result;
  }

  protected withZoomFactor(value: number): number;
  protected withZoomFactor(value: GridPoint): GridPoint;
  protected withZoomFactor(value: number | GridPoint): number | GridPoint {
    const isNumber = typeof value === 'number';

    if (isNumber) {
      return value * zoomLevelToFactor(this.zoom);
    }

    const { x, y } = value;
    return {
      x: x * zoomLevelToFactor(this.zoom),
      y: y * zoomLevelToFactor(this.zoom),
    };
  }

  protected withOffset(gridPoint: GridPoint): GridPoint {
    const { x, y } = gridPoint;

    return {
      x: x + this.translationOffset.x,
      y: y + this.translationOffset.y,
    };
  }

  protected withOffsetX(value: number) {
    return value + this.translationOffset.x;
  }

  protected withOffsetY(value: number) {
    return value + this.translationOffset.y;
  }
}
