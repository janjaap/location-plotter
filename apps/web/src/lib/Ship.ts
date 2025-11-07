import { ServerEvents, type Coordinate, type PositionPayload } from 'socket/types';
import { clientSocket } from './clientSocket';
import { Observable } from './Obserservable';
import { rotationFromHeading } from './rotationFromHeading';
import { trackIndicatorColor } from './tokens';

export class Ship extends Observable {
  private heading: number | undefined;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  set zoom(zoomLevel: number) {
    const zoomFactor = 1 + (zoomLevel - 1) / 5;
  }

  private init() {
    this.reset();
    // this.resizeObserver(this.drawOwnPosition);
    // this.drawOwnPosition();

    clientSocket.on(ServerEvents.POSITION, this.drawOwnPosition);
  }

  private drawOwnPosition = ({ position, heading }: PositionPayload) => {
    this.reset();

    const indicatorWidth = 14;
    const indicatorHeight = 6;

    //   const { x, y } = this.getGridCoordinate(position);
    const x = 0;
    const y = 0;
    const bearing = rotationFromHeading(this.heading ?? heading, heading);

    //   // TODO: smooth animation from one heading to another

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
    //   this.position = position;
  };

  teardown() {
    clientSocket.off(ServerEvents.POSITION, this.drawOwnPosition);
  }
}
