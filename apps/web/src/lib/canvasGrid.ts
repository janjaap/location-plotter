import type { Coordinate } from "socket/types";
import { coordsToDmsFormatted, ddToDms } from "../utils/ddToDms";
import { GeographicalArea } from "./geographicalArea";

type FromTo = {
  from: {
    x: number,
    y: number,
  },
  to: {
    x: number,
    y: number,
  }
};

export class CanvasGrid extends GeographicalArea {
  /**
   * Distance from the edges of the canvas where grid lines won't be drawn
   */
  gridLimit = {
    top: 40,
    right: 20,
    bottom: 40,
    left: 80,
  };
  /**
   * Distance to the edge to determine the length of the grid lines
   */
  gridPadding = 20;
  labelFontSize = 12;
  labelMaxWidth = 80;
  subdivisions = 1;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);
  }

  public init = () => {
    this.redrawGrid();

    globalThis.window.addEventListener('resize', this.handleResize);
  }

  get columnIndices() {
    return Array.from(
      { length: this.visibleLongitudeDegrees },
      (_, i) => i - Math.floor(this.visibleLongitudeDegrees / 2),
    );
  }

  get rowIndices() {
    return Array.from(
      { length: this.visibleLatitudeDegrees },
      (_, i) => i - Math.floor(this.visibleLatitudeDegrees / 2),
    );
  }

  redrawGrid = () => {
    this.drawCenterPoint();
    this.drawLongitudeLines();
    this.drawLatitudeLines();
  }

  handleResize = () => {
    this.redrawGrid();
  }

  drawCenterPoint = () => {
    this.draw(() => {
      this.context.fillStyle = '#ff0000';

      this.context.moveTo(0, 0);
      this.context.beginPath();
      this.context.arc(0, 0, 3, 0, Math.PI * 2);
      this.context.closePath();
      this.context.fill();
    });
  }

  /**
   * Get the pixel difference needed to offset the grid lines based on the current center coordinate
   */
  getGridDiff = (position: 'latitude' | 'longitude', seconds: number) => {
    const diffPercentage = seconds / 60;
    const base = position === 'latitude' ? this.gridRowHeight : this.gridColumnWidth;

    return Math.round(base * diffPercentage);
  }

  drawGridLine = ({ from, to }: FromTo) => {
    this.drawInBackground(() => {
      this.context.strokeStyle = '#424548';
      this.context.moveTo(from.x, from.y);
      this.context.lineTo(to.x, to.y);
      this.context.closePath();
      this.context.stroke();
    });
  }

  drawSubdivisionLine = ({ from, to }: FromTo) => {
    this.drawInBackground(() => {
      this.context.strokeStyle = '#424548';
      this.context.lineDashOffset = 2;
      this.context.setLineDash([4, 4]);
      this.context.moveTo(from.x, from.y);
      this.context.lineTo(to.x, to.y);
      this.context.closePath();
      this.context.stroke();
    });
  };

  drawGridLineLabel = (text: string, x: number, y: number, placement: 'longitude' | 'latitude') => {
    this.draw(() => {
      this.context.font = `${this.labelFontSize}px system-ui`;

      if (placement === 'longitude') {
        this.context.textAlign = 'center';
      } else {
        this.context.textBaseline = 'middle';
      }

      this.context.fillStyle = 'hsla(200, 3%, 79%, 0.5)';
      this.context.fillText(text, x, y, this.labelMaxWidth);
    });
  }

  /**
   * Horizontal grid lines
   */
  drawLatitudeLines = () => {
    const { degrees, minutes, seconds } = ddToDms(this.center.lat);
    const gridDiff = this.getGridDiff('latitude', seconds);
    const upperBound = (this.canvas.height / 2) - this.gridLimit.bottom;
    const lowerBound = (this.canvas.height / -2) + this.gridLimit.bottom;

    this.rowIndices.forEach((linePosition) => {
      const yOffset = (linePosition * this.gridRowHeight) + gridDiff;

      if (yOffset > upperBound || yOffset < lowerBound) {
        return;
      }

      this.drawGridLine({
        from: {
          // left-most position plus padding and label width
          x: (-this.canvas.width / 2) + (this.gridPadding + this.labelMaxWidth),
          y: yOffset,
        },
        to: {
          x: this.canvas.width / 2 - this.gridPadding,
          y: yOffset,
        },
      });

      // label
      const label = coordsToDmsFormatted(degrees, minutes - linePosition);
      const labelX = -this.canvas.width / 2 + 10;
      this.drawGridLineLabel(label, labelX, yOffset, 'latitude');
    });
  }

  /**
   * Vertical grid lines
   */
  drawLongitudeLines = () => {
    const { degrees, minutes, seconds } = ddToDms(this.center.long);
    const gridDiff = this.getGridDiff('longitude', seconds);
    const rightBound = (this.canvas.width / 2) - this.gridLimit.right;
    const leftBound = (this.canvas.width / -2) + this.gridLimit.left;

    this.columnIndices.forEach((linePosition) => {
      const xOffset = (linePosition * this.gridColumnWidth) + this.gridColumnWidth - gridDiff;

      if (xOffset > rightBound || xOffset < leftBound) {
        return;
      }

      const subdivWidth = (this.gridColumnWidth / (this.subdivisions + 1));

      Array.from({ length: this.subdivisions - 1 }, (_, i) => i + 1).forEach((subdivision) => {

        this.drawSubdivisionLine({
          from: {
            x: xOffset - subdivisionOffset,
            y: (-this.canvas.height / 2) + this.gridPadding,
          },
          to: {
            x: xOffset - subdivisionOffset,
            y: this.canvas.height / 2 - this.gridLimit.bottom,
          },
        });
      });

      this.drawGridLine({
        from: {
          x: xOffset,
          y: (-this.canvas.height / 2) + this.gridPadding,
        },
        to: {
          x: xOffset,
          y: this.canvas.height / 2 - this.gridLimit.bottom,
        },
      });

      // label
      const label = coordsToDmsFormatted(degrees, minutes + linePosition + 1);
      const labelY = this.canvas.height / 2 - this.gridPadding;
      this.drawGridLineLabel(label, xOffset, labelY, 'longitude');
    });
  }

  teardown = () => {
    globalThis.window.removeEventListener('resize', this.handleResize);

    super.teardown();
  }
}
