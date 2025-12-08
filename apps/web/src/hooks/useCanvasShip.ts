import { ServerEvents, type PositionPayload } from '@milgnss/utils/types';
import { useEffect, useState } from 'react';
import { Ship as ShipClass } from '../lib/Ship';
import { clientSocket } from '../lib/clientSocket';
import type { UseCanvasProps } from '../types';
import { useOffset } from './useOffset';
import { useReset } from './useReset';
import { useZoomLevel } from './useZoomLevel';

export const useCanvasShip = ({ canvasRef }: UseCanvasProps) => {
  const [ship, setShip] = useState<ShipClass | null>(null);

  useOffset(ship);
  useZoomLevel(ship);
  useReset(ship);

  useEffect(() => {
    const initShip = ({ position, heading }: PositionPayload) => {
      if (!canvasRef.current) return;

      const shipInstance = new ShipClass(heading, position, canvasRef.current);

      setShip(shipInstance);
    };

    const renderShip = ({ position, heading, speed }: PositionPayload) => {
      if (!ship) return;

      ship.render({ position, heading, speed });
    };

    clientSocket.on(ServerEvents.INIT, initShip);
    clientSocket.on(ServerEvents.POSITION, renderShip);

    return () => {
      clientSocket.off(ServerEvents.INIT, initShip);
      clientSocket.off(ServerEvents.POSITION, renderShip);
    };
  }, [canvasRef, ship]);
};
