import type { Coordinate } from "socket/types";
import type { FromTo } from "../types";
import { coordsToDmsFormatted, ddToDms } from "../utils/ddToDms";
import { GeographicalArea } from "./geographicalArea";

export class CanvasGrid extends GeographicalArea {
  /**
   * Distance from the edges of the canvas where grid lines won't be drawn
   */
  private gridLimit = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 90,
  };
  /**
   * Distance to the edge to determine the length of the grid lines
   */
  private gridPadding = 20;
  private labelFontSize = 12;
  private labelMaxWidth = 80;
  private _subdivisions = 1;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);
  }

  init = () => {
    this.redrawGrid();

    globalThis.window.addEventListener('resize', this.handleResize);
  }

  set subdivisions(value: number) {
    this._subdivisions = value;
  }

  get subdivisions() {
    return this._subdivisions;
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

  reset = () => {
    this.context.reset();
  }

  // bounds calculated from center point (0,0) in the middle of the canvas
  get bounds() {
    return {
      top: ((this.canvas.height / 2) - this.gridLimit.top) * -1,
      right: (this.canvas.width / 2) - this.gridLimit.right,
      bottom: (this.canvas.height / 2) - this.gridLimit.bottom,
      left: ((this.canvas.width / 2) - this.gridLimit.left) * -1,
    };
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

    return base * diffPercentage;
  }

  drawGridLine = ({ from, to }: FromTo) => {
    this.drawInBackground(() => {
      this.context.strokeStyle = 'rgb(66, 69, 72)';
      this.drawLine({ from, to });
    });
  }

  drawSubdivisionLine = ({ from, to }: FromTo) => {
    this.drawInBackground(() => {
      this.context.strokeStyle = 'rgb(66, 69, 72, 50%)';
      this.context.setLineDash([4]);
      this.context.lineDashOffset = 2;
      this.drawLine({ from, to });
    });
  };

  drawGridLineLabel = (text: string, x: number, y: number, placement: 'longitude' | 'latitude', transparency = '50%') => {
    this.drawInBackground(() => {
      this.context.font = `${this.labelFontSize}px system-ui`;

      if (placement === 'longitude') {
        this.context.textAlign = 'center';
      } else {
        this.context.textBaseline = 'middle';
      }

      this.context.fillStyle = `rgb(200, 202, 203, ${transparency})`;
      this.context.fillText(text, Math.round(x), Math.round(y), this.labelMaxWidth);
    });
  }

  /**
   * Horizontal grid lines
   */
  drawLatitudeLines = () => {
    const { degrees, minutes, seconds } = ddToDms(this.center.lat);
    const gridDiff = this.getGridDiff('latitude', seconds);
    const subdivHeight = this.gridRowHeight / (this.subdivisions + 1);

    this.rowIndices.forEach((linePosition) => {
      const yOffset = (linePosition * this.gridRowHeight) + gridDiff;
      // left-most position plus padding and label width
      const xFromPos = (-this.canvas.width / 2) + (this.gridPadding + this.labelMaxWidth);
      const xToPos = this.canvas.width / 2 - this.gridPadding;
      const labelX = (-this.canvas.width / 2) + this.gridPadding;
      const fitsWithinBounds = yOffset > this.bounds.top && yOffset < this.bounds.bottom;

      if (fitsWithinBounds) {
        this.drawGridLine({
          from: {
            x: xFromPos,
            y: yOffset,
          },
          to: {
            x: xToPos,
            y: yOffset,
          },
        });

        // label
        const label = coordsToDmsFormatted(degrees, minutes - linePosition);
        this.drawGridLineLabel(label, labelX, yOffset, 'latitude');
      }

      for (let i = 0; i <= this.subdivisions; i++) {
        const subdivYOffset = yOffset - (subdivHeight * i);
        const fitsWithinBounds = subdivYOffset > this.bounds.top && subdivYOffset < this.bounds.bottom;

        if (fitsWithinBounds && subdivYOffset !== yOffset) {
          this.drawSubdivisionLine({
            from: {
              x: xFromPos,
              y: subdivYOffset,
            },
            to: {
              x: xToPos,
              y: subdivYOffset,
            },
          });

          const label = coordsToDmsFormatted(degrees, minutes - linePosition - 1, 60 / (this.subdivisions + 1) * i, 0);
          this.drawGridLineLabel(label, labelX, subdivYOffset, 'latitude', '25%');
        }
      }
    });
  }

  /**
   * Vertical grid lines
   */
  drawLongitudeLines = () => {
    const { degrees, minutes, seconds } = ddToDms(this.center.long);
    const gridDiff = this.getGridDiff('longitude', seconds);
    const subdivWidth = this.gridColumnWidth / (this.subdivisions + 1);

    this.columnIndices.forEach((linePosition) => {
      const xOffset = (linePosition * this.gridColumnWidth) + this.gridColumnWidth - gridDiff;
      const fromYPos = (-this.canvas.height / 2) + this.gridPadding;
      const toYPos = this.canvas.height / 2 - this.gridLimit.bottom;
      const labelY = this.canvas.height / 2 - this.gridPadding;
      const fitsWithinBounds = xOffset <= this.bounds.right && xOffset >= this.bounds.left;

      if (fitsWithinBounds) {
        this.drawGridLine({
          from: {
            x: xOffset,
            y: fromYPos,
          },
          to: {
            x: xOffset,
            y: toYPos,
          },
        });

        // label
        const label = coordsToDmsFormatted(degrees, minutes + linePosition + 1);
        this.drawGridLineLabel(label, xOffset, labelY, 'longitude');
      }

      for (let i = 0; i <= this.subdivisions; i++) {
        const subdivXOffset = xOffset + (subdivWidth * i);
        const fitsWithinBounds = subdivXOffset <= this.bounds.right && subdivXOffset >= this.bounds.left;

        if (fitsWithinBounds && subdivXOffset !== xOffset) {
          this.drawSubdivisionLine({
            from: {
              x: subdivXOffset,
              y: fromYPos,
            },
            to: {
              x: subdivXOffset,
              y: toYPos,
            },
          });

          const label = coordsToDmsFormatted(degrees, minutes + linePosition + 1, 60 / (this.subdivisions + 1) * i, 0);
          this.drawGridLineLabel(label, subdivXOffset, labelY, 'longitude', '25%');
        }
      }
    });
  }

  teardown = () => {
    globalThis.window.removeEventListener('resize', this.handleResize);

    super.teardown();
  }
}
