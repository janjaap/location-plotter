import { ServerEvents, type Coordinate, type PositionPayload } from "socket/types";
import { ddToDms } from "../utils/ddToDms";
import { clientSocket } from "./clientSocket";
import { GeographicalArea } from "./geographicalArea";

export class CanvasTrack extends GeographicalArea {
  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);
  }

  reset = () => {
    this.context.beginPath();
    this.context.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
  }

  init = () => {
    clientSocket.on(ServerEvents.POSITION, this.drawLeg);
    clientSocket.on(ServerEvents.RESET, this.reset);
  }

  getGridCoordinate = (coordinate: Coordinate) => {
    const pixelsPerSecond = this.gridColumnWidth / 60;

    const { seconds: latSeconds, minutes: latMinutes } = ddToDms(coordinate.lat);
    const { seconds: longSeconds, minutes: longMinutes } = ddToDms(coordinate.long);

    const { seconds: centerLatSeconds, minutes: centerLatMinutes } = ddToDms(this.center.lat);
    const { seconds: centerLongSeconds, minutes: centerLongMinutes } = ddToDms(this.center.long);

    const longSecondsDiff = (longSeconds + (longMinutes * 60)) - (centerLongSeconds + (centerLongMinutes * 60));
    const latSecondsDiff = (centerLatSeconds + (centerLatMinutes * 60)) - (latSeconds + (latMinutes * 60));

    const x = Math.round(longSecondsDiff * pixelsPerSecond);
    const y = Math.round(latSecondsDiff * pixelsPerSecond);

    return { x, y };
  }

  drawLeg = ({ position }: PositionPayload) => {
    this.draw(() => {
      const { x, y } = this.getGridCoordinate(position);

      this.context.strokeStyle = 'white';
      this.context.lineTo(Math.round(x), Math.round(y));
      this.context.stroke();
    });
  }

  teardown = () => {
    clientSocket.off(ServerEvents.POSITION, this.drawLeg);

    super.teardown();
  }
}
