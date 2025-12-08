import { clientSocket } from '@lib/clientSocket';
import { ServerEvents, type PositionPayload } from '@milgnss/utils/types';
import { useEffect } from 'react';
import type { CanvasEntity } from '../types';

export const useReset = (objectToReset: CanvasEntity) => {
  useEffect(() => {
    const reset = ({ position, heading, speed }: PositionPayload) => {
      objectToReset?.reset({ position, heading, speed });
    };

    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.off(ServerEvents.RESET, reset);
    };
  }, [objectToReset]);
};
