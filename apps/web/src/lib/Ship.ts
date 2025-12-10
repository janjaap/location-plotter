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
const DIRTY_REGION_RADIUS = 45;

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

  private getGridCoordinate = (position: Coordinate): TGridPoint =>
    new GeoPoint(position.lat, position.long)
      .offset(super.offset)
      .zoomLevel(this.zoom)
      .gridCoordinate({ reference: this.center });

  private clearPosition(positionOffset = super.offset) {
    const offsetDiff = {
      x: (positionOffset.x - super.offset.x) * -1,
      y: (positionOffset.y - super.offset.y) * -1,
    };

    const distance = Math.max(
      Math.max(Math.abs(offsetDiff.x), Math.abs(offsetDiff.y)),
      DIRTY_REGION_RADIUS,
    );

    const origin = new GeoPoint(this.position.lat, this.position.long)
      .offset({ x: positionOffset.x + offsetDiff.x, y: positionOffset.y + offsetDiff.y })
      .zoomLevel(this.zoom)
      .gridCoordinate({ reference: this.center });

    this.clearDirty(origin, distance);
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
      this.context.translate(newPosition.x, newPosition.y);
      this.context.rotate((Math.PI * bearing) / 180);

      this.context.lineWidth = 1;
      this.context.strokeStyle = trackIndicatorColor;

      this.drawCircle({ x: 0, y: 0 }, OUTER_CIRCLE_RADIUS, 'stroke');
      this.drawCircle({ x: 0, y: 0 }, INNER_CIRCLE_RADIUS, 'stroke');

      if (speed) {
        this.drawLine({
          from: { x: 0, y: 0 },
          to: { x: 0, y: -40 },
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
