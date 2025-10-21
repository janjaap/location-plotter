'use client';

import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from 'socket/types';

export const clientSocket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io('http://localhost:5000');
