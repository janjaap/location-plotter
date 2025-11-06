import {
  ServerEvents,
  type Coordinate,
  type PositionPayload,
  type StartPositionPayload,
} from 'socket/types';
import { clientSocket } from './clientSocket';
import { Observable } from './Obserservable';
import { rotationFromHeading } from './rotationFromHeading';
import { mobMarkerColor, trackIndicatorColor } from './tokens';

export class CanvasTrackIndicator extends Observable {
  private _strokeWidth = 4;

  private heading: number | undefined;
  private position: Coordinate | undefined;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  private centerCanvas() {
    this.centerContext();
  }

  get strokeWidth() {
    return this._strokeWidth / this.zoomLevel;
  }

  set zoom(value: number) {
    if (this.zoomLevel === value) return;

    this.zoomLevel = value;

    if (!this.heading) return;

    this.reset();

    this.drawOwnPosition({
      position: this.position ?? this.center,
      heading: this.heading,
      distance: 0,
    });
  }

  private onExternalInit = ({
    heading,
    position,
    distance,
  }: PositionPayload) => {
    this.heading = heading;
    this.position = position;

    this.drawOwnPosition({ position, heading, distance });
  };

  private onExternalReset = ({ lat, long, heading }: StartPositionPayload) => {
    this.reset();

    this.drawOwnPosition({
      position: { lat, long },
      heading,
      distance: 0,
    });
  };

  private init = () => {
    this.resizeObserver(() => {
      if (!this.heading || !this.position) return;

      this.reset();

      this.drawOwnPosition({
        position: this.position ?? this.center,
        heading: this.heading,
        distance: 0,
      });
    });

    clientSocket.on(ServerEvents.INIT, this.onExternalInit);
    clientSocket.on(ServerEvents.POSITION, this.drawOwnPosition);
    clientSocket.on(ServerEvents.RESET, this.onExternalReset);
  };

  private reset = () => {
    this.clearCanvas();
    this.centerCanvas();
    this.drawMobMarker();
  };

  private drawMobMarker = () => {
    this.draw(() => {
      this.context.fillStyle = mobMarkerColor;
      this.drawCircle(0, 0, 3, 'fill');
    });
  };

  private drawOwnPosition = ({ position, heading }: PositionPayload) => {
    this.reset();

    const indicatorWidth = 14;
    const indicatorHeight = 6;

    const { x, y } = this.getGridCoordinate(position);
    const bearing = rotationFromHeading(this.heading ?? heading, heading);

    // TODO: smooth animation from one heading to another

    this.draw(() => {
      this.context.lineWidth = 1;
      this.context.strokeStyle = trackIndicatorColor;

      this.context.translate(x, y);
      this.context.rotate((Math.PI / 180) * bearing);

      this.drawCircle(0, 0, indicatorWidth, 'stroke');
      this.drawCircle(0, 0, indicatorHeight, 'stroke');
      this.drawLine({ from: { x: 0, y: 0 }, to: { x: 0, y: -40 } });
    });

    this.heading = heading;
    this.position = position;
  };

  teardown = () => {
    super.teardown();

    clientSocket.off(ServerEvents.INIT, this.onExternalInit);
    clientSocket.off(ServerEvents.POSITION, this.drawOwnPosition);
    clientSocket.off(ServerEvents.RESET, this.onExternalReset);
  };
}
