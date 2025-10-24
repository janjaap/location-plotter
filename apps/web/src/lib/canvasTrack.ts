import { ServerEvents, type Coordinate, type PositionPayload } from "socket/types";
import { clientSocket } from "./clientSocket";
import { GeographicalArea } from "./geographicalArea";
import { trackColor } from "./tokens";

export class CanvasTrack extends GeographicalArea {
  private trackPoints: Coordinate[] = [];
  private _strokeWidth = 2.5;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  get strokeWidth() {
    return this._strokeWidth / this.zoomLevel;
  }

  set zoomLevel(value: number) {
    super.zoomLevel = value;

    this.clearCanvas();
    this.trackPoints.forEach(this.drawLegLine);
  }

  init = () => {
    this.clearCanvas();

    clientSocket.on(ServerEvents.POSITION, this.drawLeg);
    clientSocket.on(ServerEvents.RESET, this.clearCanvas);
  }

  drawLegLine = (position: Coordinate) => {
    const { x, y } = this.getGridCoordinate(position);

    this.draw(() => {
      this.context.strokeStyle = trackColor;
      this.context.lineWidth = this.strokeWidth;
      this.context.lineTo(Math.round(x), Math.round(y));
      this.context.stroke();
    });
  }

  drawLeg = ({ position }: PositionPayload) => {
    this.trackPoints.push(position);

    this.drawLegLine(position);
  }

  teardown = () => {
    super.teardown();

    clientSocket.off(ServerEvents.POSITION, this.drawLeg);
    clientSocket.off(ServerEvents.RESET, this.clearCanvas);
  }
}
