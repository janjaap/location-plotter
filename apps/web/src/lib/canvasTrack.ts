import { ServerEvents, type Coordinate, type PositionPayload } from "socket/types";
import { ddToDms } from "../utils/ddToDms";
import { clientSocket } from "./clientSocket";
import { GeographicalArea } from "./geographicalArea";

export class CanvasTrack extends GeographicalArea {
  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);
  }

  positionOnTrack: Coordinate | null = null;

  init = () => {
    clientSocket.on(ServerEvents.POSITION, this.drawLeg);
  }

  drawLeg = ({ position }: PositionPayload) => {
    if (!this.positionOnTrack) {
      this.positionOnTrack = position;
      return;
    }

    const pixelsPerSecond = Math.round(this.gridColumnWidth / 60);
    const recordedPosition = this.positionOnTrack;

    this.draw(() => {
      const { seconds: latSeconds } = ddToDms(position.lat);
      const { seconds: longSeconds } = ddToDms(position.long);

      const { seconds: prevLatSeconds } = ddToDms(recordedPosition.lat);
      const { seconds: prevLongSeconds } = ddToDms(recordedPosition.long);

      console.log({
        latSeconds: Math.round(latSeconds),
        longSeconds: Math.round(longSeconds),
        prevLatSeconds: Math.round(prevLatSeconds),
        prevLongSeconds: Math.round(prevLongSeconds),
      });

      const xDiff = (prevLatSeconds - latSeconds) * pixelsPerSecond; // > 0 means move down, < 0 means move up
      const yDiff = (prevLongSeconds - longSeconds) * pixelsPerSecond; // > 0 means move left, < 0 means move right

      // console.log({ xDiff, yDiff });
      // Draw the leg
      // this.context.beginPath();
      // this.context.moveTo(this.positionOnTrack!.l, this.positionOnTrack!.y);
      // this.context.lineTo(this.positionOnTrack!.x + xDistance, this.positionOnTrack!.y + yDistance);
      // this.context.stroke();
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
