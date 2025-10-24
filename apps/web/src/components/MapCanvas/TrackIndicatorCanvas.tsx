import { useEffect, useRef } from 'react';
import { CanvasTrackIndicator } from '../../lib/canvasTrackIndicator';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const TrackIndicatorCanvas = ({ center, zoomLevel }: CanvasProps) => {
  const trackIndicatorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<CanvasTrackIndicator | null>(null);

  useEffect(() => {
    if (!trackIndicatorCanvasRef.current || !center) return;

    canvasRef.current = new CanvasTrackIndicator(center, trackIndicatorCanvasRef.current);

    return canvasRef.current.teardown;
  }, [center]);

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.zoomLevel = zoomLevel;
  }, [zoomLevel]);

  if (!center) return null;

  return <canvas className={styles.trackCanvasIndicator} ref={trackIndicatorCanvasRef}></canvas>;
}
