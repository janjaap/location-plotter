import { type ClientToServerEvents, type ServerToClientEvents } from '@milgnss/utils/types';
import { io, Socket } from 'socket.io-client';

export const clientSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.VITE_SOCKET_IO_URL,
  {
    reconnectionAttempts: 100,
    reconnectionDelay: 12_500,
    reconnectionDelayMax: 25_000,
    timeout: 5_000,
  },
);

// simulate connection drop for testing reconnection logic
clientSocket.on('connect', () => {
  setTimeout(() => {
    if (clientSocket.io.engine) {
      // close the low-level connection and trigger a reconnection
      clientSocket.io.engine.close();
    }
  }, 22_500);
});
