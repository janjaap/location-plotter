import {
  ClientEvents,
  ServerEvents,
  type Coordinate,
  type PositionPayload,
  type StartPositionPayload,
} from 'socket/types';
import type { GridPoint } from '../types';
import { gridCoordinate } from '../utils/gridCoordinate';
import { rotationFromHeading } from '../utils/rotationFromHeading';
import { Canvas, zoomFactorToLevel } from './canvas';
import { clientSocket } from './clientSocket';
import { Observable } from './Obserservable';
import { trackIndicatorColor } from './tokens';

export class Ship extends Observable {
  private heading: number | undefined;
  private position: Coordinate | undefined;

  constructor(...args: ConstructorParameters<typeof Canvas>) {
    super(...args);

    this.init();
  }

  get zoom() {
    return super.zoom;
  }

  set zoom(zoomLevel: number) {
    super.zoom = zoomLevel;

    if (!this.heading || !this.position) return;

    this.reset();

    this.drawOwnPosition({
      position: this.position ?? this.center,
      heading: this.heading,
    });
  }

  private init() {
    this.reset();

    this.resizeObserver(() => {
      if (!this.heading || !this.position) return;

      this.reset();

      this.drawOwnPosition({
        position: this.position ?? this.center,
        heading: this.heading,
      });
    });

    clientSocket.on(ServerEvents.INIT, this.onExternalInit);
    clientSocket.on(ServerEvents.POSITION, this.drawOwnPosition);
    clientSocket.on(ServerEvents.RESET, this.onExternalReset);
  }

  private onExternalReset = ({ position, heading }: StartPositionPayload) => {
    this.reset();

    this.drawOwnPosition({
      position,
      heading,
    });
  };

  private onExternalInit = ({ heading, position }: StartPositionPayload) => {
    this.heading = heading;
    this.position = position;

    this.drawOwnPosition({ position, heading, distance: 0 });
  };

  private fitsWithinBounds({ x, y }: GridPoint) {
    const margin = 100; // pixels to edge of the grid

    return (
      x >= this.bounds.left + margin &&
      x <= this.bounds.right - margin &&
      y >= this.bounds.top + margin &&
      y <= this.bounds.bottom - margin
    );
  }

  private drawOwnPosition = ({ position, heading, speed }: PositionPayload) => {
    if (this.position) {
      const { x, y } = this.getGridCoordinate(this.position);

      this.context.clearRect(x - 100, y - 100, 200, 200);
    }

    const indicatorWidth = 14;
    const indicatorHeight = 6;

    const { x, y } = this.getGridCoordinate(position);
    const bearing = rotationFromHeading(this.heading ?? heading, heading);

    // TODO: smooth animation from one heading to another
    {
      this.draw(() => {
        this.context.lineWidth = 1;
        this.context.strokeStyle = trackIndicatorColor;

        this.context.translate(x, y);

        this.context.rotate((Math.PI / 180) * bearing);

        this.drawCircle(0, 0, indicatorWidth, 'stroke');
        this.drawCircle(0, 0, indicatorHeight, 'stroke');

        if (speed) {
          this.drawLine({ from: { x: 0, y: 0 }, to: { x: 0, y: speed * -1.5 } });
        }
      });
    }

    // TODO: zoom back in when position fits within bounds with zoomLevel plus one

    if (!this.fitsWithinBounds({ x, y })) {
      const level = zoomFactorToLevel(this.zoom);
      clientSocket.emit(ClientEvents.ZOOM, level - 1);
    }
    // else {
    //   const { x, y } = gridCoordinate({
    //     position,
    //     reference: this.center,
    //     pixelsPerLatSecond: this.getPixelsPerLatSecond(this.zoom + 1),
    //     pixelsPerLongSecond: this.getPixelsPerLongSecond(this.zoom + 1),
    //   });

    //   if (this.fitsWithinBounds({ x, y })) {
    //     const level = zoomFactorToLevel(this.zoom);
    //     clientSocket.emit(ClientEvents.ZOOM, level + 1);
    //   }
    // }

    this.heading = heading;
    this.position = position;
  };

  private getGridCoordinate(position: Coordinate): GridPoint {
    return gridCoordinate({
      position,
      reference: this.center,
      pixelsPerLatSecond: this.getPixelsPerLatSecond(),
      pixelsPerLongSecond: this.getPixelsPerLongSecond(),
    });
  }

  teardown() {
    clientSocket.off(ServerEvents.INIT, this.onExternalInit);
    clientSocket.off(ServerEvents.POSITION, this.drawOwnPosition);
    clientSocket.off(ServerEvents.RESET, this.onExternalReset);

    super.teardown();
  }
}
