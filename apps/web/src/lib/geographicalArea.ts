import type { Coordinate } from "socket/types";
import type { FromTo } from "../types";

export abstract class GeographicalArea {
  /**
   * Number of vertical degree indicators visible on the canvas
   */
  private _visibleLongitudeDegrees = 3;
  /**
   * Number of horizontal degree indicators visible on the canvas
   */
  private _visibleLatitudeDegrees = 3;

  protected canvas: HTMLCanvasElement;
  protected context!: CanvasRenderingContext2D;

  /**
   * Starting location and center of the geographical area
   */
  private _center: Coordinate;

  private _zoomLevel = 1;

  abstract reset(): void;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    this._center = center;
    this.canvas = canvas;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get 2D canvas context');
    }

    this.context = context;

    this.init();
  }

  init = () => {
    this.centerContextToCoordinate();

    globalThis.window.addEventListener('resize', this.handleResize);
  }

  protected drawInBackground = (drawFunc: () => void) => {
    this.context.save();
    this.context.globalCompositeOperation = 'destination-over';

    this.draw(drawFunc)

    this.context.restore();
  }

  protected draw = (drawFunc: () => void) => {
    this.context.save();

    drawFunc();

    this.context.restore();
  }

  get visibleLongitudeDegrees() {
    return this._visibleLongitudeDegrees;
  }

  get visibleLatitudeDegrees() {
    return this._visibleLatitudeDegrees;
  }

  get gridColumnWidth() {
    return (this.canvas.width / this.visibleLongitudeDegrees) * this._zoomLevel;
  }

  get gridRowHeight() {
    return (this.canvas.height / this.visibleLatitudeDegrees) * this._zoomLevel;
  }

  get center() {
    return this._center;
  }

  get zoomLevel() {
    return this._zoomLevel;
  }

  set zoomLevel(value: number) {
    this._zoomLevel = value;
  }

  drawLine = ({ from, to }: FromTo) => {
    this.context.beginPath();
    this.context.moveTo(Math.round(from.x), Math.round(from.y));
    this.context.lineTo(Math.round(to.x), Math.round(to.y));
    this.context.closePath();
    this.context.stroke();
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
