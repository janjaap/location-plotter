import { ServerEvents, type PositionPayload } from '@milgnss/utils/types';
import { useParams } from '@providers/ParamsProvider/ParamsProvider';
import { useEffect, useState } from 'react';
import { Ship as ShipClass } from '../lib/Ship';
import { clientSocket } from '../lib/clientSocket';
import type { UseCanvasProps } from '../types';

export const useCanvasShip = ({ canvasRef }: UseCanvasProps) => {
  const [ship, setShip] = useState<ShipClass | null>(null);
  const { offset } = useParams();

  useEffect(() => {
    if (!ship || (!offset.x && !offset.y)) return;

    ship.offset = offset;
  }, [ship, offset]);

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
    clientSocket.on(ServerEvents.RESET, renderShip);

    return () => {
      clientSocket.off(ServerEvents.INIT, initShip);
      clientSocket.off(ServerEvents.POSITION, renderShip);
      clientSocket.off(ServerEvents.RESET, renderShip);
    };
  }, [canvasRef, ship]);
};
