import { useEffect, useRef } from 'react';
import { Ship as ShipClass } from '../../lib/Ship';
import { useZoom } from '../../providers/ZoomProvider/ZoomProvider';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const Ship = ({ center }: CanvasProps) => {
  const trackIndicatorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const shipRef = useRef<ShipClass | null>(null);
  const { zoomLevel } = useZoom();

  useEffect(() => {
    if (!trackIndicatorCanvasRef.current || !center || shipRef.current) return;

    shipRef.current = new ShipClass(center, trackIndicatorCanvasRef.current);

    const ship = shipRef.current;

    return () => {
      ship.teardown();
    };
  }, [center]);

  useEffect(() => {
    if (!shipRef.current) return;

    // shipRef.current.zoom = zoomLevel;
  }, [zoomLevel]);

  if (!center) return null;

  return (
    <canvas
      className={styles.ship}
      ref={trackIndicatorCanvasRef}
    />
  );
};
