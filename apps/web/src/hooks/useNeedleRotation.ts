import { bearingFromHeading } from '@milgnss/utils';
import { ServerEvents, type PositionPayload } from '@milgnss/utils/types';
import { useCallback, useEffect, useState } from 'react';
import { clientSocket } from '../lib/clientSocket';

export const useNeedleRotation = () => {
  const [needleRotation, setNeedleRotation] = useState<number | null>(null);

  const updatePosition = useCallback(
    ({ heading }: PositionPayload) => {
      if (needleRotation === null) return;

      const rotation = bearingFromHeading(needleRotation, heading);

      setNeedleRotation(rotation);
    },
    [needleRotation],
  );

  const initializeNeedle = useCallback(
    ({ heading }: PositionPayload) => {
      const rotation = bearingFromHeading(needleRotation ?? 0, heading);

      setNeedleRotation(rotation);
    },
    [needleRotation],
  );

  useEffect(() => {
    clientSocket.on(ServerEvents.INIT, initializeNeedle);
    clientSocket.on(ServerEvents.POSITION, updatePosition);

    return () => {
      clientSocket.off(ServerEvents.INIT, initializeNeedle);
      clientSocket.off(ServerEvents.POSITION, updatePosition);
    };
  }, [initializeNeedle, updatePosition]);

  return needleRotation;
};
