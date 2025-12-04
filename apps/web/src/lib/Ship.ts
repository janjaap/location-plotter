import { bearingFromHeading, gridCoordinate } from '@milgnss/utils';
import { type Coordinate, type GridPoint, type PositionPayload } from '@milgnss/utils/types';
import { Canvas } from './canvas';
import { trackIndicatorColor } from './tokens';

const OUTER_CIRCLE_RADIUS = 14;
const INNER_CIRCLE_RADIUS = 6;
const DIRTY_REGION_RADIUS = 42;

export class Ship extends Canvas {
  private heading: number | undefined;

  constructor(...args: ConstructorParameters<typeof Canvas>) {
    super(...args);

    this.init();
  }

  private init() {
    this.centerContext();
  }

  renderCurrentPosition = ({ position, heading, speed }: PositionPayload) => {
    const bearing = bearingFromHeading(this.heading ?? heading, heading);

    const radianFromBearing = (Math.PI * bearing) / 180;

    this.clearDirty(this.getGridCoordinate(position), DIRTY_REGION_RADIUS);

    // TODO: smooth animation from one heading to another
    this.draw(() => {
      const gridPoint = this.getGridCoordinate(position);

      const x = gridPoint.x + this.translationOffset.x;
      const y = gridPoint.y + this.translationOffset.y;

      this.clip({ x, y }, DIRTY_REGION_RADIUS);

      this.context.translate(x, y);
      this.context.rotate(radianFromBearing);

      this.context.lineWidth = 1;
      this.context.strokeStyle = trackIndicatorColor;

      this.drawCircle(
        { x: this.translationOffset.x, y: this.translationOffset.y },
        OUTER_CIRCLE_RADIUS,
        'stroke',
      );
      this.drawCircle(
        { x: this.translationOffset.x, y: this.translationOffset.y },
        INNER_CIRCLE_RADIUS,
        'stroke',
      );

      if (speed) {
        this.drawLine({
          from: { x: this.translationOffset.x, y: this.translationOffset.y },
          to: { x: this.translationOffset.x, y: this.translationOffset.y - 40 },
        });
      }

      this.context.translate(-x, -y);
      this.context.rotate(-radianFromBearing);
    });

    this.heading = heading;
  };

  private getGridCoordinate(position: Coordinate): GridPoint {
    return gridCoordinate({
      position,
      reference: this.center,
      pixelsPerLatSecond: Canvas.PIXELS_PER_LAT_SECOND,
      pixelsPerLongSecond: Canvas.PIXELS_PER_LONG_SECOND,
      offset: super.offset,
    });
  }
}
