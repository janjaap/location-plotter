import { clientSocket } from '@lib/clientSocket';
import { ClientEvents, ServerEvents, type PositionPayload } from '@milgnss/utils/types';
import { useEffect, useState } from 'react';

export const useSocketReconnect = () => {
  const [position, setPosition] = useState<PositionPayload | null>(null);

  useEffect(() => {
    clientSocket.on(ServerEvents.POSITION, setPosition);

    return () => {
      clientSocket.off(ServerEvents.POSITION, setPosition);
    };
  }, []);

  useEffect(() => {
    if (!position) return;

    const reconnect = () => {
      // debugger;
      if (!clientSocket.recovered) return;

      clientSocket.emit(ClientEvents.START, position);
    };

    clientSocket.on('disconnect', reconnect);
    clientSocket.on('connect', reconnect);

    return () => {
      clientSocket.off('connect', reconnect);
      clientSocket.off('disconnect', reconnect);
    };
  }, [position]);
};
