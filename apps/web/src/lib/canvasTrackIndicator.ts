import { ServerEvents, type Coordinate, type PositionPayload } from "socket/types";
import { clientSocket } from "./clientSocket";
import { GeographicalArea } from "./geographicalArea";
import { mobMarkerColor, trackIndicatorColor } from "./tokens";

export class CanvasTrackIndicator extends GeographicalArea {
  private _strokeWidth = 4;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  get strokeWidth() {
    return this._strokeWidth / this.zoomLevel;
  }

  init = () => {
    clientSocket.on(ServerEvents.POSITION, this.moveIndicator);
    clientSocket.on(ServerEvents.RESET, this.reset);

    this.drawCenterDot();
  }

  reset = () => {
    this.clearCanvas();
    this.centerContextToCoordinate();
    this.drawCenterDot();
  }

  drawCenterDot = () => {
    console.log('drawing center dot');
    this.drawDot({ x: 0, y: 0, radius: 3, fillStyle: mobMarkerColor });
  }

  moveIndicator = ({ position }: PositionPayload) => {
    this.reset();

    const { x, y } = this.getGridCoordinate(position);
    this.drawDot({ x, y, radius: 2, fillStyle: trackIndicatorColor });
  }

  drawDot = ({ x, y, radius, fillStyle }: { x: number; y: number; radius: number; fillStyle: string }) => {
    this.draw(() => {
      console.log('drawing dot at', x, y);
      this.context.fillStyle = fillStyle;

      this.context.moveTo(x, y);
      this.context.beginPath();
      this.context.arc(x, y, radius, 0, Math.PI * 2);
      this.context.closePath();
      this.context.fill();
    });
  }

  teardown = () => {
    super.teardown();

    clientSocket.off(ServerEvents.POSITION, this.moveIndicator);
    clientSocket.off(ServerEvents.RESET, this.reset);
  }
}
