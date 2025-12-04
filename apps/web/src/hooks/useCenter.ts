import { ServerEvents, type Coordinate, type PositionPayload } from '@milgnss/utils/types';
import { useEffect, useState } from 'react';
import { clientSocket } from '../lib/clientSocket';

export const useCenter = () => {
  const [center, setCenter] = useState<Coordinate | null>(null);

  useEffect(() => {
    const init = ({ position }: PositionPayload) => {
      setCenter(position);
    };

    clientSocket.on(ServerEvents.INIT, init);

    return () => {
      clientSocket.off(ServerEvents.INIT, init);
    };
  }, []);

  return center;
};
