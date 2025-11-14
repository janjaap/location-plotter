import { useEffect, useRef, useState } from 'react';
import { Ship as ShipClass } from '../../lib/Ship';
import { useZoom } from '../../providers/ZoomProvider/ZoomProvider';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const Ship = ({ center }: CanvasProps) => {
  const shipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ship, setShip] = useState<ShipClass | null>(null);
  const { zoomLevel } = useZoom();

  useEffect(() => {
    if (!shipCanvasRef.current) return;

    const shipInstance = new ShipClass(center, shipCanvasRef.current);
    setShip(shipInstance);

    return () => shipInstance.teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.long]);

  useEffect(() => {
    if (!ship) return;

    ship.zoom = zoomLevel;
  }, [ship, zoomLevel]);

  return (
    <canvas
      className={styles.ship}
      ref={shipCanvasRef}
    />
  );
};
