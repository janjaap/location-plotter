import { useEffect, useState } from 'react';
import { Ship as ShipClass } from '../lib/Ship';
import type { UseCanvasProps } from '../types';
import { useOffset } from './useOffset';
import { usePosition } from './usePosition';
import { useReset } from './useReset';
import { useSocketReconnect } from './useSocketReconnect';
import { useZoomLevel } from './useZoomLevel';

export const useCanvasShip = ({ canvasRef }: UseCanvasProps) => {
  const [ship, setShip] = useState<ShipClass | null>(null);
  const { position, heading, speed } = usePosition();

  useSocketReconnect();
  useOffset(ship);
  useZoomLevel(ship);
  useReset(ship);

  useEffect(() => {
    if (!canvasRef.current || !position || !heading || ship) return;

    const shipInstance = new ShipClass(heading, position, canvasRef.current);

    setShip(shipInstance);
  }, [canvasRef, heading, position, ship]);

  useEffect(() => {
    if (!position || !heading || !speed || !ship) return;

    ship.render({ position, heading, speed });
  }, [position, heading, speed, ship]);
};
