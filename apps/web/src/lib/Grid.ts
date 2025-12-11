import { coordsToDmsFormatted, ddToDms, ddToDmsFormatted } from '@milgnss/utils';
import { SECONDS_PER_MINUTE } from '@milgnss/utils/constants';
import { type FromTo, type GridPoint, type Orientation } from '@milgnss/utils/types';
import { Canvas } from './Canvas';
import { GeoPoint } from './GeoPoint';
import { GridCoordinate } from './GridCoordinate';
import { LatAxis } from './LatAxis';
import { LongAxis } from './LongAxis';
import {
  centerMarkerColor,
  gridBackgroundColor,
  gridLabelColor,
  gridLineColor,
  subgridLabelColor,
} from './tokens';

type DrawAxisSideParams = {
  orientation: Orientation;
  direction: 1 | -1;
};

type DrawGridAxisParams = {
  orientation: Orientation;
};

type ComputeSubdivisionLabelParams = {
  orientation: Orientation;
  direction: 1 | -1;
  degrees: number;
  minutes: number;
  index: number;
  secondsPerSubdivision: number;
};

export class Grid extends Canvas {
  private readonly markerRadius = 10;

  private readonly axis: {
    lat: LatAxis;
    long: LongAxis;
  };

  constructor(...args: ConstructorParameters<typeof Canvas>) {
    super(...args);

    this.axis = {
      lat: new LatAxis(...args),
      long: new LongAxis(...args),
    };

    this.init();
  }

  get offset() {
    return super.offset;
  }

  set offset(newOffset: GridPoint) {
    super.offset = newOffset;

    this.axis.lat.offset = newOffset;
    this.axis.long.offset = newOffset;

    this.render(true);
  }

  set zoomLevel(newZoomLevel: number) {
    this.zoom = newZoomLevel;

    this.axis.lat.zoomLevel = newZoomLevel;
    this.axis.long.zoomLevel = newZoomLevel;

    this.render(true);
  }

  private init() {
    this.centerContext();
    this.render();
  }

  private renderCenterMarker() {
    this.draw(() => {
      this.context.fillStyle = centerMarkerColor;
      const position = new GeoPoint(this.center.lat, this.center.long)
        .offset(super.offset)
        .zoomLevel(this.zoom)
        .toGridCoordinate({ reference: this.center }).point;

      const cappedPosition = this.cap(position);

      const { within, left, right, top } = this.markerWithinBounds(position);

      if (!within) {
        const rotation = !right ? 90 : !left ? -90 : !top ? 0 : 180;
        this.drawSemiCircle(cappedPosition, this.markerRadius, 'fill', rotation);
      } else {
        this.drawCircle(cappedPosition, this.markerRadius, 'fill');
      }
    });
  }

  private computeSubdivisionLabel({
    orientation,
    direction,
    degrees,
    minutes,
    index,
    secondsPerSubdivision,
  }: ComputeSubdivisionLabelParams) {
    let seconds = secondsPerSubdivision * index * direction;

    const invert =
      (orientation === 'lat' && direction === 1) || (orientation === 'long' && direction === -1);

    if (invert) seconds = SECONDS_PER_MINUTE - seconds;

    if (seconds === 0 || seconds === SECONDS_PER_MINUTE) return null;

    let minutesAdj = invert ? -1 : 0;

    if (seconds > SECONDS_PER_MINUTE) {
      minutesAdj += invert ? -1 : 1;
      seconds -= SECONDS_PER_MINUTE;
    }

    if (seconds < 0) {
      minutesAdj -= 1;
      seconds += SECONDS_PER_MINUTE;
    }

    return coordsToDmsFormatted({ degrees, minutes: minutes + minutesAdj, seconds }, 0);
  }

  private renderAxisSide({ orientation, direction }: DrawAxisSideParams) {
    const {
      axisFitsWithinBounds,
      baseOffset,
      getClosestMinute,
      labelFitsWithinBounds,
      labelOrigin,
      labelPosition,
      makeLineCoords,
      pixelsPerSecond,
      subDivSize,
    } = this.axis[orientation];

    const pixelsPerMinute = pixelsPerSecond * SECONDS_PER_MINUTE;
    let { minuteOffset } = this.axis[orientation];
    let pos = baseOffset() + direction * pixelsPerMinute;

    // Main minute lines
    while (axisFitsWithinBounds(pos)) {
      this.renderGridLine(makeLineCoords(pos));

      if (labelFitsWithinBounds(pos)) {
        const closestMinute = getClosestMinute(minuteOffset);
        const labelText = ddToDmsFormatted(closestMinute);

        this.renderLabel(labelText, labelPosition(pos), labelOrigin(pos));
      }

      pos += direction * pixelsPerMinute;
      minuteOffset += direction;
    }

    // Subdivisions
    pos = baseOffset() + direction * subDivSize;

    let subIndex = direction;
    const { degrees, minutes } = ddToDms(getClosestMinute());
    const secondsPerSubdivision = SECONDS_PER_MINUTE / (this.minuteDivisions + 1);

    while (axisFitsWithinBounds(pos)) {
      this.renderGridSubdivisionLine(makeLineCoords(pos));

      if (labelFitsWithinBounds(pos)) {
        const labelText = this.computeSubdivisionLabel({
          orientation,
          direction,
          degrees,
          minutes,
          index: subIndex,
          secondsPerSubdivision,
        });

        if (labelText) {
          this.renderLabel(labelText, labelPosition(pos), labelOrigin(pos));
        }
      }

      pos += direction * subDivSize;
      subIndex += direction;
    }
  }

  private renderGridAxis({ orientation }: DrawGridAxisParams) {
    const {
      baseOffset,
      getClosestMinute,
      labelAlign,
      labelPosition,
      labelOrigin,
      makeLineCoords,
      labelFitsWithinBounds,
    } = this.axis[orientation];

    const closest = getClosestMinute();

    this.context.textAlign = labelAlign;

    // Draw the main minute line
    this.renderGridLine(makeLineCoords(baseOffset()));

    if (labelFitsWithinBounds(baseOffset())) {
      this.renderLabel(
        ddToDmsFormatted(closest),
        labelPosition(baseOffset()),
        labelOrigin(baseOffset()),
      );
    }

    // Draw outward in both directions
    this.renderAxisSide({
      orientation,
      direction: +1,
    });

    this.renderAxisSide({
      orientation,
      direction: -1,
    });
  }

  private renderGridLine(fromTo: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 1;
      this.context.strokeStyle = gridLineColor;

      const from = new GridCoordinate(fromTo.from.x, fromTo.from.y)
        .offset(this.offset)
        .zoomLevel(this.zoom).point;
      const to = new GridCoordinate(fromTo.to.x, fromTo.to.y)
        .offset(this.offset)
        .zoomLevel(this.zoom).point;

      this.drawLine({
        from,
        to,
      });
    });
  }

  private renderGridSubdivisionLine(fromTo: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 0.5;
      this.context.strokeStyle = subgridLabelColor;
      this.context.lineDashOffset = 1;
      this.context.setLineDash([4]);

      const from = new GridCoordinate(fromTo.from.x, fromTo.from.y)
        .offset(this.offset)
        .zoomLevel(this.zoom).point;
      const to = new GridCoordinate(fromTo.to.x, fromTo.to.y)
        .offset(this.offset)
        .zoomLevel(this.zoom).point;

      this.drawLine({
        from,
        to,
      });
    });
  }

  private renderLabel(text: string, gridPoint: GridPoint, position?: GridPoint) {
    this.draw(() => {
      this.context.font = '12px system-ui';
      this.context.textBaseline = 'middle';
      this.context.fillStyle = gridLabelColor;

      if (position) {
        const { x, y } = position;

        this.draw(() => {
          this.context.fillStyle = gridBackgroundColor;
          this.context.rect(x, y, Canvas.LABEL_WIDTH, Canvas.LABEL_HEIGHT);
          this.context.fill();
        });
      }

      this.text({ text, gridPoint });
    });
  }

  private markerWithinBounds = ({ x, y }: GridPoint) => {
    const left = x >= -this.canvasWidth / 2 - this.markerRadius;
    const right = x <= this.canvasWidth / 2 + this.markerRadius;
    const top = y >= -this.canvasHeight / 2 - this.markerRadius;
    const bottom = y <= this.canvasHeight / 2 + this.markerRadius;

    return {
      left,
      right,
      top,
      bottom,
      within: left && right && top && bottom,
    };
  };

  render = (performFullReset = false) => {
    if (performFullReset) {
      this.resetCanvas();
    }

    this.renderGridAxis({
      orientation: 'lat',
    });

    this.renderGridAxis({
      orientation: 'long',
    });

    this.renderCenterMarker();
  };

  reset() {
    this.render(true);
  }
}
