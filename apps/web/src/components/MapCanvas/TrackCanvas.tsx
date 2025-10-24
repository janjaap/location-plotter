import { useEffect, useRef } from 'react';
import { CanvasTrack } from '../../lib/canvasTrack';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const TrackCanvas = ({ center, zoomLevel }: CanvasProps) => {
  const trackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<CanvasTrack | null>(null);

  useEffect(() => {
    if (!trackCanvasRef.current || !center) return;

    canvasRef.current = new CanvasTrack(center, trackCanvasRef.current);

    return canvasRef.current.teardown;
  }, [center]);

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.zoomLevel = zoomLevel;
  }, [zoomLevel]);

  if (!center) return null;

  return <canvas className={styles.trackCanvas} ref={trackCanvasRef}></canvas>;
}
