import type { Coordinate } from "socket/types";

export abstract class GeographicalArea {
  /**
   * Number of vertical degree indicators visible on the canvas
   */
  visibleLongitudeDegrees: number = 3;
  /**
   * Number of horizontal degree indicators visible on the canvas
   */
  visibleLatitudeDegrees: number = 3;

  canvas: HTMLCanvasElement;
  context!: CanvasRenderingContext2D;

  /**
   * Starting location and center of the geographical area
   */
  center: Coordinate;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    this.center = center;
    this.canvas = canvas;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get 2D canvas context');
    }

    this.context = context;

    this.centerContextToCoordinate();

    globalThis.window.addEventListener('resize', this.handleResize);
  }

  protected drawInBackground = (drawFunc: () => void) => {
    this.context.globalCompositeOperation = 'destination-over';

    this.draw(drawFunc)

    this.context.globalCompositeOperation = 'source-over';
  }

  protected draw = (drawFunc: () => void) => {
    this.context.save();

    drawFunc();

    this.context.restore();
  }

  get gridColumnWidth() {
    return Math.round(this.canvas.width / this.visibleLongitudeDegrees);
  }

  get gridRowHeight() {
    return Math.round(this.canvas.height / this.visibleLatitudeDegrees);
  }

  handleResize = () => {
    this.centerContextToCoordinate();
  }

  centerContextToCoordinate = () => {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
  }

  teardown() {
    globalThis.window.removeEventListener('resize', this.handleResize);
  }
}
