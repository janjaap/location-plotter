import { ServerEvents, type Coordinate, type PositionPayload } from "socket/types";
import { ddToDms } from "../utils/ddToDms";
import { clientSocket } from "./clientSocket";
import { GeographicalArea } from "./geographicalArea";

// const trackPoints: Coordinate[] = [];

export class CanvasTrack extends GeographicalArea {
  private trackPoints: Coordinate[] = [];
  private strokeWidth = 2.5;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    clientSocket.on(ServerEvents.POSITION, this.drawLeg);
    clientSocket.on(ServerEvents.RESET, this.reset);
  }

  set zoomLevel(value: number) {
    super.zoomLevel = value;

    this.clearCanvas();
    this.trackPoints.forEach(this.drawLegLine);
  }

  reset = () => {
    this.clearCanvas();
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

  drawLegLine = (position: Coordinate) => {
    this.draw(() => {
      const { x, y } = this.getGridCoordinate(position);

      this.context.strokeStyle = '#99c4dc';
      this.context.lineWidth = this.strokeWidth / this.zoomLevel;
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
    clientSocket.off(ServerEvents.RESET, this.reset);
  }
}
