import { useEffect, useRef } from 'react';
import { CanvasTrackIndicator } from '../../lib/canvasTrackIndicator';
import { useZoom } from '../../providers/ZoomProvider/ZoomProvider';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const TrackIndicatorCanvas = ({ center }: CanvasProps) => {
  const trackIndicatorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<CanvasTrackIndicator | null>(null);
  const { zoomLevel } = useZoom();

  useEffect(() => {
    if (!trackIndicatorCanvasRef.current || !center) return;

    canvasRef.current = new CanvasTrackIndicator(
      center,
      trackIndicatorCanvasRef.current,
    );
    canvasRef.current.zoom = zoomLevel;

    return canvasRef.current.teardown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.zoom = zoomLevel;
  }, [zoomLevel]);

  if (!center) return null;

  return (
    <canvas
      className={styles.trackCanvasIndicator}
      ref={trackIndicatorCanvasRef}
    />
  );
};
