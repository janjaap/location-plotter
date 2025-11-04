import {
  ServerEvents,
  type Coordinate,
  type PositionPayload,
} from 'socket/types';
import { clientSocket } from './clientSocket';
import { Observable } from './Obserservable';
import { trackColor } from './tokens';

export class CanvasTrack extends Observable {
  private trackPoints: Coordinate[] = [];

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  set zoom(value: number) {
    if (this.zoomLevel === value) return;

    this.zoomLevel = value;
    this.clearCanvas();
    this.trackPoints.forEach(this.drawLegLine);
  }

  private init = () => {
    this.setObserver(this.handleResize);

    clientSocket.on(ServerEvents.POSITION, this.drawLeg);
    clientSocket.on(ServerEvents.RESET, this.clearCanvas);
  };

  private handleResize = () => {
    this.clearCanvas();
    this.trackPoints.forEach(this.drawLegLine);
  };

  private drawLegLine = (position: Coordinate) => {
    const { x, y } = this.getGridCoordinate(position);

    this.draw(() => {
      this.context.strokeStyle = trackColor;
      this.context.lineWidth = 10;

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
