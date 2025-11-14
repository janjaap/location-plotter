import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { getDistance } from './getDistance';
import {
  ClientEvents,
  ClientToServerEvents,
  Coordinate,
  ServerEvents,
  ServerToClientEvents,
  StartPositionPayload,
} from './types';
import { updatePosition } from './updatePosition';

const httpServer = createServer();
const port = 5000;
const sockets = new Set<Socket>();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

const POSITION_UPDATE_INTERVAL = 1_000; // ms
const MAX_BEARING = 120; // degrees

function applyRandomBearing(heading: number) {
  const bearing = Math.floor(Math.random() * (MAX_BEARING * 2 + 1)) - MAX_BEARING;
  let newHeading = heading + bearing;

  if (newHeading < 0) {
    newHeading += 360;
  } else if (newHeading >= 360) {
    newHeading -= 360;
  }

  return Math.round(newHeading);
}

let positionInterval: NodeJS.Timeout;
let headingInterval: NodeJS.Timeout;

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  let initialPosition: StartPositionPayload;
  let currentPosition: Coordinate;
  let currentHeading: number;

  sockets.add(socket);

  socket.emit(ServerEvents.CONNECTED);

  const cleanup = () => {
    clearInterval(positionInterval);
    clearInterval(headingInterval);
  };

  socket
    .on(ClientEvents.INIT, (startPosition) => {
      const { position, heading, speed } = startPosition;
      initialPosition = startPosition;

      socket.emit(ServerEvents.INIT, {
        position,
        heading,
        speed,
      });
    })

    .on(ClientEvents.START, (startPosition) => {
      const { position, speed, heading } = startPosition;
      currentHeading = Number(heading);
      currentPosition = position;

      const generateNewHeading = () => {
        currentHeading = applyRandomBearing(currentHeading);

        clearInterval(headingInterval);
        headingInterval = setInterval(generateNewHeading, Math.random() * 5_000);
      };

      generateNewHeading();

      const emitNewHeading = () => {
        const newPosition = updatePosition(
          currentPosition.lat,
          currentPosition.long,
          speed,
          currentHeading,
          POSITION_UPDATE_INTERVAL / 1_000,
        );
        const distance = getDistance(position, newPosition);

        socket.emit(ServerEvents.POSITION, {
          position: newPosition,
          distance,
          heading: currentHeading,
        });

        console.log('emit position', newPosition);

        currentPosition = newPosition;
      };

      socket.emit(ServerEvents.POSITION, {
        position,
        distance: 0,
        heading,
      });

      positionInterval = setInterval(emitNewHeading, POSITION_UPDATE_INTERVAL);
    })

    .on(ClientEvents.ZOOM, (zoomLevel: number) => {
      socket.emit(ServerEvents.ZOOM, zoomLevel);
    })

    .on(ClientEvents.STOP, () => {
      socket.emit(ServerEvents.STOPPED);
      cleanup();
    })

    .on(ClientEvents.RESET, () => {
      socket.emit(ServerEvents.RESET, initialPosition);
    })

    .on(ClientEvents.CLOSE, () => {
      console.log('websocket connection closed');
      cleanup();
    })

    .on(ClientEvents.ERROR, (err: Error) => {
      console.error(err);
      cleanup();
    })

    .on(ClientEvents.DISCONNECT, (reason: string) => {
      cleanup();
      console.log(`socket ${socket.id} disconnected due to ${reason}`);
    });
});

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
