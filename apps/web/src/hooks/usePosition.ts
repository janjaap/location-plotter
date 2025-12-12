import { clientSocket } from '@lib/clientSocket';
import { ServerEvents, type Coordinate, type PositionPayload } from '@milgnss/utils/types';
import { useEffect, useState } from 'react';

export const usePosition = () => {
  const [startPosition, setStartPosition] = useState<Coordinate | null>(null);
  const [positionData, setPositionData] = useState<PositionPayload | null>(null);

  useEffect(() => {
    const initPosition = ({ position }: PositionPayload) => {
      setStartPosition(position);
    };

    clientSocket.on(ServerEvents.INIT, initPosition);
    clientSocket.on(ServerEvents.POSITION, setPositionData);

    return () => {
      clientSocket.off(ServerEvents.POSITION, setPositionData);
      clientSocket.off(ServerEvents.INIT, initPosition);
    };
  }, []);

  return { startPosition, ...positionData };
};
