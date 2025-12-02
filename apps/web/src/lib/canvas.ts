import type { CanvasBounds, Coordinate, FromTo, GridPoint } from '@milgnss/utils/types';

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

  static PIXELS_PER_LONG_SECOND = 15;

  static PIXELS_PER_LAT_SECOND = 13;

  protected canvas: HTMLCanvasElement;

  protected center: Coordinate;

  protected context!: CanvasRenderingContext2D;

  protected minuteDivisions = 5;

  protected previousOffset: GridPoint = { x: 0, y: 0 };

  protected translationOffset: GridPoint = { x: 0, y: 0 };

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

  static validOffset(offset: GridPoint) {
    return (
      offset.x > -Canvas.OFFSET_CLAMP &&
      offset.x < Canvas.OFFSET_CLAMP &&
      offset.y > -Canvas.OFFSET_CLAMP &&
      offset.y < Canvas.OFFSET_CLAMP
    );
  }

  get offset(): GridPoint {
    return this.translationOffset;
  }

  set offset(newOffset: GridPoint) {
    if (!Canvas.validOffset(newOffset)) {
      return;
    }

    if (this.previousOffset.x === newOffset.x && this.previousOffset.y === newOffset.y) {
      return;
    }

    this.previousOffset = this.translationOffset;
    this.translationOffset = newOffset;
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

    this.context.rect(fromX, fromY, width, height);
    this.context.clip();
  }

  protected clip({ x, y }: GridPoint, radius: number) {
    const fromX = Math.round(x);
    const fromY = Math.round(y);

    this.context.rect(fromX - radius, fromY - radius, radius * 2, radius * 2);
    this.context.clip();
  }

  protected reset() {
    this.clearCanvas();
    this.centerContext();
  }

  protected centerContext() {
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

  protected withOffset(gridPoint: GridPoint): GridPoint {
    const { x, y } = gridPoint;

    return {
      x: x + this.translationOffset.x,
      y: y + this.translationOffset.y,
    };
  }

  protected withOffsetX(value: number): number {
    return value + this.translationOffset.x;
  }

  protected withOffsetY(value: number): number {
    return value + this.translationOffset.y;
  }
}
