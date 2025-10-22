import { ServerEvents, type Coordinate, type PositionPayload } from "socket/types";
import { ddToDms } from "../utils/ddToDms";
import { clientSocket } from "./clientSocket";
import { GeographicalArea } from "./geographicalArea";

export class CanvasTrack extends GeographicalArea {
  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);
  }

  private positionOnTrack: Coordinate | null = null;

  init = () => {
    clientSocket.on(ServerEvents.POSITION, this.drawLeg);
  }

  getCoordinateFromSeconds = (latSeconds: number, longSeconds: number) => {
    // here be logic
  }

  drawLeg = ({ position }: PositionPayload) => {
    if (!this.positionOnTrack) {
      this.positionOnTrack = position;
      return;
    }

    const pixelsPerSecond = this.gridColumnWidth / 60;
    const recordedPosition = this.positionOnTrack;

    this.draw(() => {
      const { seconds: centerLatSeconds } = ddToDms(this.center.lat);
      const { seconds: centerLongSeconds } = ddToDms(this.center.long);

      const { seconds: latSeconds } = ddToDms(position.lat);
      const { seconds: longSeconds } = ddToDms(position.long);

      const { seconds: prevLatSeconds } = ddToDms(recordedPosition.lat);
      const { seconds: prevLongSeconds } = ddToDms(recordedPosition.long);

      const xDiff = (prevLatSeconds - latSeconds) * pixelsPerSecond * this.zoomLevel; // > 0 means move down, < 0 means move up
      const yDiff = (prevLongSeconds - longSeconds) * pixelsPerSecond * this.zoomLevel; // > 0 means move left, < 0 means move right

      // how far is previous point from center
      const prevX = ((centerLatSeconds - prevLatSeconds) * pixelsPerSecond) + (this.canvas.width / 2);
      const prevY = ((centerLongSeconds - prevLongSeconds) * pixelsPerSecond) + (this.canvas.height / 2);

      console.log({
        // gridColumnWidth: this.gridColumnWidth,
        // pixelsPerSecond,
        xDiff,
        yDiff,
        prevX,
        prevY,
        newX: Math.round(prevX + xDiff - (this.canvas.width / 2)),
        newY: Math.round(prevY + yDiff - (this.canvas.height / 2)),
        // zoomLevel: this.zoomLevel,
      });

      // Draw the leg
      this.context.strokeStyle = '#ff0000';
      this.context.moveTo(Math.round(prevX), Math.round(prevY));
      this.context.beginPath();
      this.context.lineTo(
        Math.round(prevX + xDiff - (this.canvas.width / 2)),
        Math.round(prevY + yDiff - (this.canvas.height / 2)),
      );
      this.context.stroke();
    });

    this.positionOnTrack = position;
  }

  teardown = () => {
    clientSocket.off(ServerEvents.POSITION, this.drawLeg);
    super.teardown();
  }
}

// export function canvasTrack(canvasInstance: HTMLCanvasElement) {
//   const context = canvasInstance.getContext('2d');

//   if (!context) {
//     throw new Error('Could not get canvas context');
//   }

//   clientSocket.on(ServerEvents.POSITION, (position) => {
//     const drawLeg = () => {
//       context.save();

//       context.restore();
//     };

//     const { x, y } = position;
//   });

//   const centerContextToCoordinate = () => {
//     canvasInstance.width = canvasInstance.clientWidth;
//     canvasInstance.height = canvasInstance.clientHeight;
//     context.translate(canvasInstance.width / 2, canvasInstance.height / 2);
//   }

//   const draw = () => {
//     centerContextToCoordinate();
//   };

//   const teardown = () => {
//     globalThis.window.removeEventListener('resize', draw);
//   }

//   globalThis.window.addEventListener('resize', draw);

//   return { draw, teardown };
// }
