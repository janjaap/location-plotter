import { ServerEvents, type PositionPayload } from '@milgnss/utils/types';
import { useEffect, useState } from 'react';
import { Ship as ShipClass } from '../lib/Ship';
import { clientSocket } from '../lib/clientSocket';
import type { UseCanvasProps } from '../types';
import { useCenter } from './useCenter';

export const useCanvasShip = ({ canvasRef }: UseCanvasProps) => {
  const [ship, setShip] = useState<ShipClass | null>(null);
  const center = useCenter();

  useEffect(() => {
    if (!canvasRef.current || ship || !center) return;

    const shipInstance = new ShipClass(center, canvasRef.current);

    setShip(shipInstance);
  }, [canvasRef, center, center?.lat, center?.long, ship]);

  useEffect(() => {
    const renderShip = ({ position, heading, speed }: PositionPayload) => {
      if (!ship) return;

      ship.renderCurrentPosition({ position, heading, speed });
    };

    clientSocket.on(ServerEvents.INIT, renderShip);
    clientSocket.on(ServerEvents.POSITION, renderShip);
    clientSocket.on(ServerEvents.RESET, renderShip);

    return () => {
      clientSocket.off(ServerEvents.INIT, renderShip);
      clientSocket.off(ServerEvents.POSITION, renderShip);
      clientSocket.off(ServerEvents.RESET, renderShip);
    };
  }, [center, ship]);
};
