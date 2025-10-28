import {
  ServerEvents,
  type Coordinate,
  type PositionPayload,
} from 'socket/types';
import { clientSocket } from './clientSocket';
import { GeographicalArea } from './geographicalArea';
import { trackColor } from './tokens';

export class CanvasTrack extends GeographicalArea {
  private trackPoints: Coordinate[] = [];

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  set zoomLevel(value: number) {
    super.zoomLevel = value;

    this.clearCanvas();
    this.trackPoints.forEach(this.drawLegLine);
  }

  init = () => {
    this.clearCanvas();
    this.observeCanvasResize(this.handleResize);

    clientSocket.on(ServerEvents.POSITION, this.drawLeg);
    clientSocket.on(ServerEvents.RESET, this.clearCanvas);
  };

  handleResize = () => {
    this.clearCanvas();
    this.trackPoints.forEach(this.drawLegLine);
  };

  drawLegLine = (position: Coordinate) => {
    const { x, y } = this.getGridCoordinate(position);

    this.draw(() => {
      this.context.strokeStyle = trackColor;
      this.context.lineWidth = 2;
      this.context.lineTo(Math.round(x), Math.round(y));
      this.context.stroke();
    });
  };

  drawLeg = ({ position }: PositionPayload) => {
    this.trackPoints.push(position);

    this.drawLegLine(position);
  };

  teardown = () => {
    super.teardown();

    clientSocket.off(ServerEvents.POSITION, this.drawLeg);
    clientSocket.off(ServerEvents.RESET, this.clearCanvas);
  };
}
