import { bearingFromHeading } from '@milgnss/utils';
import {
  type Coordinate,
  type PositionPayload,
  type GridPoint as TGridPoint,
} from '@milgnss/utils/types';
import { Canvas } from './Canvas';
import { GeoPoint } from './GeoPoint';
import { trackIndicatorColor } from './tokens';

const OUTER_CIRCLE_RADIUS = 14;
const INNER_CIRCLE_RADIUS = 6;

export class Ship extends Canvas {
  private heading: number;
  private position: Coordinate;
  private speed = 0;

  constructor(heading: number, center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.heading = heading;
    this.position = center;

    this.init();
  }

  private init() {
    this.centerContext();
  }

  private getGridCoordinate = (position: Coordinate, positionOffset = super.offset) =>
    new GeoPoint(position.lat, position.long)
      .offset(positionOffset)
      .zoomLevel(this.zoom)
      .toGridCoordinate({ reference: this.center });

  private clearPosition(positionOffset = super.offset) {
    const offsetDiff = {
      x: (positionOffset.x - super.offset.x) * -1,
      y: (positionOffset.y - super.offset.y) * -1,
    };

    const distance = Math.max(
      Math.max(Math.abs(offsetDiff.x), Math.abs(offsetDiff.y)),
      this.clipRegion,
    );

    const previousOffset = {
      x: positionOffset.x + offsetDiff.x,
      y: positionOffset.y + offsetDiff.y,
    };

    const origin = this.getGridCoordinate(this.position, previousOffset);

    this.clearDirty(origin, distance);
  }

  private get clipRegion() {
    return Math.max(OUTER_CIRCLE_RADIUS * 2, this.speedVector);
  }

  private get speedVector() {
    return (this.speed ?? 0) * 4;
  }

  set zoomLevel(newZoomLevel: number) {
    this.clearPosition();

    this.zoom = newZoomLevel;

    this.render({ position: this.position, heading: this.heading, speed: this.speed });
  }

  set offset(newOffset: TGridPoint) {
    this.clearPosition(newOffset);

    super.offset = newOffset;

    this.render({
      position: this.position,
      heading: this.heading,
      speed: this.speed,
    });
  }

  render = ({ position, heading, speed }: PositionPayload) => {
    const bearing = bearingFromHeading(this.heading, heading);
    const newPosition = this.getGridCoordinate(position);
    const previousPosition = this.getGridCoordinate(this.position);
    const offsetDiff = {
      x: previousPosition.x - newPosition.x,
      y: previousPosition.y - newPosition.y,
    };

    this.clearPosition(offsetDiff);

    // TODO: smooth animation from one heading to another
    this.draw(() => {
      this.clip(newPosition, this.clipRegion);
      this.context.translate(newPosition.x, newPosition.y);
      this.context.rotate((Math.PI * bearing) / 180);

      this.context.lineWidth = 1;
      this.context.strokeStyle = trackIndicatorColor;

      this.drawCircle({ x: 0, y: 0 }, OUTER_CIRCLE_RADIUS, 'stroke');
      this.drawCircle({ x: 0, y: 0 }, INNER_CIRCLE_RADIUS, 'stroke');

      if (speed) {
        this.drawLine({
          from: { x: 0, y: 0 },
          to: { x: 0, y: -this.speedVector },
        });
      }
    });

    this.heading = heading;
    this.position = position;
    this.speed = speed ?? 0;
  };

  reset({ position, heading, speed }: PositionPayload) {
    this.render({ position, heading, speed });
  }
}
