import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { getDistance } from './getDistance';
import {
  ClientEvents,
  ClientToServerEvents,
  Coordinate,
  ServerEvents,
  ServerToClientEvents,
  StartPositionPayload
} from './types';
import { updatePosition } from './updatePosition';

const httpServer = createServer();
const port = 5000;
const sockets = new Set<Socket>();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

const POSITION_UPDATE_INTERVAL = 100; // ms
const MAX_BEARING = 90; // degrees

let initialPosition: StartPositionPayload;
let currentPosition: Coordinate;
let currentHeading: number;
let positionInterval: NodeJS.Timeout;
let headingInterval: NodeJS.Timeout;

function applyRandomBearing(heading: number) {
  const bearing = Math.floor(Math.random() * ((MAX_BEARING * 2) + 1)) - MAX_BEARING;
  let newHeading = heading + bearing;

  if (newHeading < 0) {
    newHeading += 360;
  } else if (newHeading >= 360) {
    newHeading -= 360;
  }

  return Math.round(newHeading);
}

io.on(
  'connection',
  (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    sockets.add(socket);

    socket.emit(ServerEvents.CONNECTED);

    socket.on(ClientEvents.INIT, (startPosition) => {
      const { lat, long, heading } = startPosition;
      initialPosition = startPosition;

      socket.emit(ServerEvents.INIT, { lat, long }, 0, heading);
    });

    socket.on(ClientEvents.START, (startPosition) => {
      // initialPosition = startPosition;

      socket.emit(ServerEvents.MARKER, startPosition);

      const { lat, long, speed, heading } = startPosition;
      currentHeading = Number(heading);
      currentPosition = { lat, long };

      const generateNewHeading = () => {
        currentHeading = applyRandomBearing(currentHeading);

        clearInterval(headingInterval);

        headingInterval = setInterval(generateNewHeading, Math.random() * 5_000);
      };

      generateNewHeading();

      positionInterval = setInterval(() => {
        const newPosition = updatePosition(
          currentPosition.lat,
          currentPosition.long,
          speed,
          currentHeading,
          POSITION_UPDATE_INTERVAL / 1_000,
        );
        const distance = getDistance({ lat, long }, newPosition);

        socket.emit(ServerEvents.POSITION, { position: newPosition, distance, heading: currentHeading });

        currentPosition = newPosition;
      }, POSITION_UPDATE_INTERVAL);
    });

    socket.on(ClientEvents.STOP, () => {
      socket.emit(ServerEvents.STOPPED);

      clearInterval(positionInterval);
      clearInterval(headingInterval);
    });

    socket.on(ClientEvents.RESET, () => {
      socket.emit(ServerEvents.RESET, initialPosition);
    });

    socket.on(ClientEvents.CLOSE, () => {
      console.log('websocket connection closed');
    });

    socket.on(ClientEvents.ERROR, (err: Error) => {
      console.error(err);
    });

    socket.on(ClientEvents.DISCONNECT, (reason: string) => {
      console.log(`socket ${socket.id} disconnected due to ${reason}`);
    });
  }
);

httpServer
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen({ port }, () => {
    console.log(`Socket.io server runs at: http://localhost:${port}`);
  });

process.on('SIGINT', () => {
  for (const socket of sockets) {
    socket.disconnect();

    sockets.delete(socket);
  }

  io.close();
  process.exit(0);
});
