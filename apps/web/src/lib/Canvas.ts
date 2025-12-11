import { zoomLevelToFactor } from '@milgnss/utils';
import {
  ModificationsEnum,
  type CanvasBounds,
  type Coordinate,
  type FromTo,
  type GridPoint,
  type PositionPayload,
} from '@milgnss/utils/types';

type TextParams = {
  text: string;
  gridPoint: GridPoint;
  maxWidth?: number;
  clearBefore?: boolean;
};

export abstract class Canvas {
  static CANVAS_PADDING = 10;

  static LABEL_HEIGHT = 20;

  static LABEL_WIDTH = 80;

  static OFFSET_CLAMP = 1_024;

  private canvas: HTMLCanvasElement;

  private translationOffset: GridPoint = { x: 0, y: 0 };

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

  protected cap(position: GridPoint, margin = 0): GridPoint {
    const { x, y } = position;
    const { top, right, bottom, left } = this.absoluteBounds;

    return {
      x: Math.min(Math.max(x, left - margin), right - margin),
      y: Math.min(Math.max(y, top - margin), bottom - margin),
    };
  }

  protected text({
    text,
    gridPoint,
    maxWidth = Canvas.LABEL_WIDTH,
    clearBefore = false,
  }: TextParams) {
    const x = Math.round(gridPoint.x);
    const y = Math.round(gridPoint.y);

    if (clearBefore) {
      this.clearRect(
        { x: gridPoint.x, y: gridPoint.y - Canvas.LABEL_HEIGHT / 2 },
        Canvas.LABEL_WIDTH,
        Canvas.LABEL_HEIGHT,
      );
    }

    this.context.fillText(text, x, y, maxWidth);
  }

  protected clearRect(gridPoint: GridPoint, width: number, height: number) {
    const { x, y } = gridPoint;

    const fromX = Math.round(x);
    const fromY = Math.round(y);

    this.context.clearRect(fromX, fromY, width, height);
  }

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

  protected resetCanvas() {
    this.clearCanvas();
    this.centerContext();
  }

  protected centerContext() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
  }

  protected draw(drawFunc: () => void) {
    this.context.save();

    drawFunc();

    this.context.restore();
  }

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

  protected drawInBackground(drawFunc: () => void) {
    this.context.save();
    this.context.globalCompositeOperation = 'destination-over';

    this.draw(drawFunc);

    this.context.restore();
  }

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
