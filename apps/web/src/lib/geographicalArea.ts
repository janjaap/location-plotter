import { type Coordinate } from "socket/types";
import type { FromTo } from "../types";
import { ddToDms } from "../utils/ddToDms";

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
  private _subdivisions = 1;
  private _animationId: number | null = null;

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

    cancelAnimationFrame(this._animationId ?? 0);
    this._animationId = requestAnimationFrame(drawFunc);
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

  set subdivisions(value: number) {
    this._subdivisions = value;
  }

  get subdivisions() {
    if (this._subdivisions < 1) {
      return 1;
    }

    return this._subdivisions;
  }

  clearCanvas = () => {
    this.context.beginPath();
    this.context.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
  }

  drawLine = ({ from, to }: FromTo) => {
    this.context.beginPath();
    this.context.moveTo(Math.round(from.x), Math.round(from.y));
    this.context.lineTo(Math.round(to.x), Math.round(to.y));
    this.context.closePath();
    this.context.stroke();
  }

  getGridCoordinate = (coordinate: Coordinate) => {
    const pixelsPerSecond = this.gridColumnWidth / 60;

    const { seconds: latSeconds, minutes: latMinutes } = ddToDms(coordinate.lat);
    const { seconds: longSeconds, minutes: longMinutes } = ddToDms(coordinate.long);

    const { seconds: centerLatSeconds, minutes: centerLatMinutes } = ddToDms(this.center.lat);
    const { seconds: centerLongSeconds, minutes: centerLongMinutes } = ddToDms(this.center.long);

    const longSecondsDiff = (longSeconds + (longMinutes * 60)) - (centerLongSeconds + (centerLongMinutes * 60));
    const latSecondsDiff = (centerLatSeconds + (centerLatMinutes * 60)) - (latSeconds + (latMinutes * 60));

    // TODO: account for crossing the 180th meridian and the poles
    // TODO: account for degree crossing

    const x = Math.round(longSecondsDiff * pixelsPerSecond);
    const y = Math.round(latSecondsDiff * pixelsPerSecond);

    return { x, y };
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
    globalThis.window.removeEventListener('resize', this?.handleResize);
    cancelAnimationFrame(this?._animationId ?? 0);
  }
}
