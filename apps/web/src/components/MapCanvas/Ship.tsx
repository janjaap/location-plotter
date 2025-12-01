import { useEffect, useRef, useState } from 'react';
import { ServerEvents, type PositionPayload } from 'socket/types';
import { clientSocket } from '../../lib/clientSocket';
import { Ship as ShipClass } from '../../lib/Ship';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const Ship = ({ center }: CanvasProps) => {
  const shipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ship, setShip] = useState<ShipClass | null>(null);

  useEffect(() => {
    if (!shipCanvasRef.current || ship) return;

    const shipInstance = new ShipClass(center, shipCanvasRef.current);

    setShip(shipInstance);
  }, [center, center.lat, center.long, ship]);

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
      clientSocket.offAny(renderShip);
    };
  }, [center, ship]);

  return (
    <canvas
      className={styles.ship}
      ref={shipCanvasRef}
    />
  );
};
