'use client';

import type { ClientToServerEvents, ServerToClientEvents } from '@milgnss/utils/types';
import { io, Socket } from 'socket.io-client';

export const clientSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  'http://localhost:5000',
  {
    reconnectionAttempts: 1_000,
    reconnectionDelay: 500,
    reconnectionDelayMax: 2_000,
    timeout: 5_000,
  },
);
