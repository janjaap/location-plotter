import { bearingFromHeading, gridCoordinate } from '@milgnss/utils';
import { type Coordinate, type GridPoint, type PositionPayload } from '@milgnss/utils/types';
import { Canvas } from './Canvas';
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

  set offset(newOffset: GridPoint) {
    super.offset = newOffset;

    this.clearDirty(this.getGridCoordinate(this.position), DIRTY_REGION_RADIUS);

    this.render({
      position: this.position,
      heading: this.heading,
      speed: this.speed,
    });
  }

  render = ({ position, heading, speed }: PositionPayload) => {
    const bearing = bearingFromHeading(this.heading, heading);
    const gridPoint = this.getGridCoordinate(position);

    // TODO: smooth animation from one heading to another
    this.draw(() => {
      this.clearDirty(this.getGridCoordinate(this.position), DIRTY_REGION_RADIUS);
      this.clip(gridPoint, DIRTY_REGION_RADIUS);

      this.context.translate(gridPoint.x, gridPoint.y);
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

  private getGridCoordinate(position: Coordinate): GridPoint {
    return gridCoordinate({
      position,
      reference: this.center,
      offset: super.offset,
    });
  }
}
