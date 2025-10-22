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

  useEffect(() => {
    if (!trackCanvasRef.current || !center) return;

    const canvas = new CanvasTrack(center, trackCanvasRef.current);

    canvas.zoomLevel = zoomLevel;

    canvas.init();

    return canvas.teardown;
  }, [center, zoomLevel]);

  if (!center) return null;

  return <canvas className={styles.trackCanvas} ref={trackCanvasRef}></canvas>;
}
