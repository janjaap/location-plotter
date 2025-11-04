import { ServerEvents, type Coordinate } from 'socket/types';
import type { FromTo } from '../types';
import { coordsToDmsFormatted, ddToDms } from '../utils/ddToDms';
import { Canvas } from './canvas';
import { clientSocket } from './clientSocket';
import { Observable } from './Obserservable';
import { gridLabelColor, gridLineColor, subgridLabelColor } from './tokens';

export class CanvasGrid extends Observable {
  /**
   * Distance from the edges of the canvas where grid lines won't be drawn
   */
  private gridLimit = {
    top: 40,
    right: 40,
    bottom: 40, // prevent overlap with longitude labels
    left: 90, // prevent overlap with latitude labels
  };

  /**
   * Distance in pixels
   */
  private gridPadding = 16;

  private labelFontSize = 12;

  private labelMaxWidth = 80;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  private init = () => {
    this.setObserver(this.redrawGrid);
    this.redrawGrid();

    clientSocket.on(ServerEvents.RESET, this.reset);
  };

  get columnIndices() {
    return Array.from(
      { length: Canvas.MAX_VISIBLE_DEGREES_LONG },
      (_, i) => i - Math.floor(Canvas.MAX_VISIBLE_DEGREES_LONG / 2),
    );
  }

  get rowIndices() {
    return Array.from(
      { length: Canvas.MAX_VISIBLE_DEGREES_LAT },
      (_, i) => i - Math.floor(Canvas.MAX_VISIBLE_DEGREES_LAT / 2),
    );
  }

  get gridColumnWidth() {
    return (
      ((this.canvas.width - 2 * this.gridPadding) /
        Canvas.MAX_VISIBLE_DEGREES_LONG) *
      this.zoomLevel
    );
  }

  get gridRowHeight() {
    return (
      ((this.canvas.height - 2 * this.gridPadding) /
        Canvas.MAX_VISIBLE_DEGREES_LAT) *
      this.zoomLevel
    );
  }

  set zoom(value: number) {
    if (this.zoomLevel === value) return;

    this.zoomLevel = value;
    this.subdivisions = value;

    this.redrawGrid();
  }

  // bounds calculated from center point (0,0) in the middle of the canvas
  get bounds() {
    return {
      top: (this.canvas.height / 2 - this.gridLimit.top) * -1,
      right: this.canvas.width / 2 - this.gridLimit.right,
      bottom: this.canvas.height / 2 - this.gridLimit.bottom,
      left: (this.canvas.width / 2 - this.gridLimit.left) * -1,
    };
  }

  private reset = () => {
    this.redrawGrid();
  };

  private redrawGrid = () => {
    this.clearCanvas();
    this.centerContext();
    this.drawLongitudeLines();
    this.drawLatitudeLines();

    this.draw(() => {
      this.context.strokeStyle = 'white';
      this.context.lineWidth = 1;
      this.drawLine({
        // vertical
        from: { x: 0, y: -this.canvas.height / 2 },
        to: { x: 0, y: this.canvas.height / 2 },
      });

      this.drawLine({
        // horizontal
        from: { x: -this.canvas.width / 2, y: 0 },
        to: { x: this.canvas.width / 2, y: 0 },
      });
    });
  };

  /**
   * Get the pixel difference needed to offset the grid lines based on the current center coordinate
   */
  getGridDiff(position: 'latitude' | 'longitude', seconds: number) {
    const diffPercentage = seconds / 60;
    const base =
      position === 'latitude' ? this.gridRowHeight : this.gridColumnWidth;

    return base * diffPercentage;
  }

  drawGridLine({ from, to }: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 1.5;
      this.context.strokeStyle = gridLineColor;
      this.context.lineDashOffset = 0;
      this.context.setLineDash([]);

      this.drawLine({ from, to });
    });
  }

  drawSubdivisionLine({ from, to }: FromTo) {
    this.drawInBackground(() => {
      this.context.lineWidth = 0.5;
      this.context.strokeStyle = subgridLabelColor;
      this.context.lineDashOffset = 1;
      this.context.setLineDash([4]);

      this.drawLine({ from, to });
    });
  }

  drawSubgridLineLabel(text: string, x: number, y: number) {
    this.drawLabel(text, x, y, subgridLabelColor);
  }

  drawGridLineLabel(text: string, x: number, y: number) {
    this.drawLabel(text, x, y, gridLabelColor);
  }

  drawLabel(text: string, x: number, y: number, fillStyle: string) {
    this.draw(() => {
      this.context.font = `${this.labelFontSize}px system-ui`;
      this.context.textBaseline = 'middle';
      this.context.fillStyle = fillStyle;
      this.context.fillText(
        text,
        Math.round(x),
        Math.round(y),
        this.labelMaxWidth,
      );
    });
  }

  /**
   * Horizontal grid lines
   */
  drawLatitudeLines() {
    const { degrees, minutes, seconds } = ddToDms(this.center.lat);
    const gridDiff = this.getGridDiff('latitude', seconds);
    const subdivHeight = this.gridRowHeight / (this.subdivisions + 1);

    this.context.textAlign = 'start';

    this.rowIndices.forEach((linePosition) => {
      const yOffset = linePosition * this.gridRowHeight + gridDiff;
      // left-most position plus padding and label width
      const xFromPos =
        -this.canvas.width / 2 + (this.gridPadding + this.labelMaxWidth);
      const xToPos = this.canvas.width / 2 - this.gridPadding;
      const labelX = -this.canvas.width / 2 + this.gridPadding;

      {
        const fitsWithinBounds =
          yOffset > this.bounds.top && yOffset < this.bounds.bottom;

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
          const label = coordsToDmsFormatted({
            degrees,
            minutes: minutes - linePosition,
            seconds: 0,
          });

          this.drawGridLineLabel(label, labelX, yOffset);
        }
      }

      for (let i = 0; i <= this.subdivisions; i++) {
        const subdivYOffset = yOffset + subdivHeight * i;
        const fitsWithinBounds =
          subdivYOffset > this.bounds.top && subdivYOffset < this.bounds.bottom;

        if (!fitsWithinBounds || subdivYOffset === yOffset) continue;

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

        const label = coordsToDmsFormatted(
          {
            degrees,
            minutes: minutes - linePosition - 1,
            seconds: 60 - (60 / (this.subdivisions + 1)) * i,
          },
          0,
        );

        this.drawSubgridLineLabel(label, labelX, subdivYOffset);
      }
    });
  }

  /**
   * Vertical grid lines
   */
  drawLongitudeLines() {
    const { degrees, minutes, seconds } = ddToDms(this.center.long);
    const gridDiff = this.getGridDiff('longitude', seconds);
    const subdivWidth = this.gridColumnWidth / (this.subdivisions + 1);
    this.context.textAlign = 'center';

    this.columnIndices.forEach((linePosition) => {
      const xOffset =
        linePosition * this.gridColumnWidth +
        this.gridColumnWidth -
        gridDiff -
        this.gridPadding / 2;
      const fromYPos = -this.canvas.height / 2 + this.gridPadding;
      const toYPos = this.canvas.height / 2 - this.gridLimit.bottom;
      const labelY = this.canvas.height / 2 - this.gridPadding;

      {
        const fitsWithinBounds =
          xOffset <= this.bounds.right && xOffset >= this.bounds.left;

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
          const label = coordsToDmsFormatted({
            degrees,
            minutes: minutes + linePosition + 1,
            seconds: 0,
          });

          this.drawGridLineLabel(label, xOffset, labelY);
        }
      }

      for (let i = 0; i <= this.subdivisions; i++) {
        const subdivXOffset = xOffset + subdivWidth * i;
        const fitsWithinBounds =
          subdivXOffset <= this.bounds.right &&
          subdivXOffset >= this.bounds.left;

        if (!fitsWithinBounds || subdivXOffset === xOffset) continue;

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

        const label = coordsToDmsFormatted(
          {
            degrees,
            minutes: minutes + linePosition + 1,
            seconds: (60 / (this.subdivisions + 1)) * i,
          },
          0,
        );

        this.drawSubgridLineLabel(label, subdivXOffset, labelY);
      }
    });
  }

  teardown = () => {
    super.teardown();

    clientSocket.off(ServerEvents.RESET, this.reset);
  };
}
