import {
  ClientEvents,
  ClientToServerEvents,
  Coordinate,
  PositionPayload,
  ServerEvents,
  ServerToClientEvents,
} from '@milgnss/utils/types';
import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { getDistance } from './getDistance';
import { updatePosition } from './updatePosition';

const httpServer = createServer();
const port = 5000;
const host = 'localhost';
const sockets = new Set<Socket>();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    preflightContinue: true,
    origin: '*',
    allowedHeaders: [
      'Access-Control-Allow-Headers',
      'X-Requested-With',
      'X-Access-Token',
      'Content-Type',
      'Host',
      'Accept',
      'Connection',
      'Cache-Control',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  connectionStateRecovery: {},
});

export const POSITION_UPDATE_INTERVAL = 1_000; // ms
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
// let speedInterval: NodeJS.Timeout;
let initialPosition: PositionPayload;
let currentPosition: Coordinate;
let currentHeading: number;
let currentSpeed: number;

const cleanup = () => {
  clearInterval(positionInterval);
  clearInterval(headingInterval);
  // clearInterval(speedInterval);
};

const generateNewHeading = () => {
  currentHeading = applyRandomBearing(currentHeading);

  clearInterval(headingInterval);
  headingInterval = setInterval(generateNewHeading, Math.random() * 5_000);
};

// const generateNewSpeed = () => {
//   const speedChange = Math.floor(Math.random() * 10) - 1;
//   currentSpeed = Math.max(0, currentSpeed + speedChange);

//   console.log({ speedChange, currentSpeed });

//   clearInterval(speedInterval);
//   speedInterval = setInterval(generateNewSpeed, Math.random() * 5_000);
// };

const broadcastPositionUpdate = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  startPosition: PositionPayload,
) => {
  cleanup();

  const { position, speed, heading } = startPosition;
  console.log('broadcastPositionUpdate', startPosition);
  currentHeading = Number(heading);
  currentPosition = position;
  currentSpeed = speed ?? 0;

  generateNewHeading();

  // generateNewSpeed();

  const emitNewHeading = () => {
    const newPosition = updatePosition(
      currentPosition.lat,
      currentPosition.long,
      currentSpeed,
      currentHeading,
      POSITION_UPDATE_INTERVAL / 1_000,
    );
    const distance = getDistance(position, newPosition);

    socket.emit(ServerEvents.POSITION, {
      position: newPosition,
      distance,
      heading: currentHeading,
      speed: currentSpeed,
    });

    currentPosition = newPosition;
  };

  positionInterval = setInterval(emitNewHeading, POSITION_UPDATE_INTERVAL);
  emitNewHeading();
};

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  sockets.add(socket);

  socket
    .once(ClientEvents.INIT, (startPosition) => {
      const { position, heading, speed } = startPosition;
      initialPosition = startPosition;

      socket.emit(ServerEvents.INIT, {
        position,
        heading,
        speed,
      });
    })

    .on(ClientEvents.START, (position: PositionPayload) =>
      broadcastPositionUpdate(socket, position),
    )

    .on(ClientEvents.STOP, () => {
      socket.emit(ServerEvents.STOPPED);
      cleanup();
    })

    .on(ClientEvents.RESET, () => {
      socket.emit(ServerEvents.RESET, initialPosition);
    });
});

const disconnectAllSockets = () => {
  for (const socket of sockets) {
    socket.disconnect();

    sockets.delete(socket);
  }
};

httpServer
  .once('error', (err) => {
    disconnectAllSockets();
    console.error(err);
    process.exit(1);
  })
  .listen({ port }, () => {
    console.log(`Socket.io server runs at: http://${host}:${port}`);
  });

process.on('SIGINT', () => {
  disconnectAllSockets();

  io.close();
  process.exit(0);
});
