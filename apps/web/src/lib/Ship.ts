import { bearingFromHeading, gridCoordinate } from '@milgnss/utils';
import { type Coordinate, type GridPoint, type PositionPayload } from '@milgnss/utils/types';
import { Canvas } from './canvas';
import { trackIndicatorColor } from './tokens';

const OUTER_CIRCLE_RADIUS = 14;
const INNER_CIRCLE_RADIUS = 6;
const DIRTY_REGION_RADIUS = 42;

export class Ship extends Canvas {
  private heading: number | undefined;
  // private position: Coordinate | undefined;

  constructor(...args: ConstructorParameters<typeof Canvas>) {
    super(...args);

    this.init();
  }

  // get zoom() {
  //   return super.zoom;
  // }

  // set zoom(zoomLevel: number) {
  //   super.zoom = zoomLevel;

  //   this.resetOwnPosition();
  // }

  private init() {
    this.centerContext();
  }

  // private resetOwnPosition = () => {
  //   if (!this.position || !this.heading) return;

  //   this.renderCurrentPosition({ position: this.position, heading: this.heading });
  // };

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
    // this.position = position;
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
