import { useEffect, useRef } from 'react';
import type { Coordinate } from 'socket/types';
import { CanvasTrack } from '../../lib/canvasTrack';
import styles from './MapCanvas.module.css';

interface Props {
  center: Coordinate | null;
  zoomLevel: number;
}

export const TrackCanvas = ({ center, zoomLevel }: Props) => {
  const trackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<CanvasTrack | null>(null);

  useEffect(() => {
    if (!trackCanvasRef.current || !center) return;

    canvasRef.current = new CanvasTrack(center, trackCanvasRef.current);
    canvasRef.current.init();

    return canvasRef.current.teardown;
  }, [center]);

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.zoomLevel = zoomLevel;
  }, [zoomLevel]);

  if (!center) return null;

  return <canvas className={styles.trackCanvas} ref={trackCanvasRef}></canvas>;
}
