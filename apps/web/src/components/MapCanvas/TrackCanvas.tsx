import { useEffect, useRef } from 'react';
import type { Coordinate } from 'socket/types';
import { CanvasTrack } from '../../lib/canvasTrack';
import styles from './MapCanvas.module.css';

interface Props {
  center: Coordinate | null;
}

export const TrackCanvas = ({ center }: Props) => {
  const trackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!trackCanvasRef.current || !center) return;

    const canvas = new CanvasTrack(center, trackCanvasRef.current);

    canvas.init();

    return canvas.teardown;
  }, [center]);

  if (!center) return null;

  return <canvas className={styles.trackCanvas} ref={trackCanvasRef}></canvas>;
}
