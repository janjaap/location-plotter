import { useEffect, useRef } from 'react';
import { Grid as GridClass } from '../../lib/Grid';
import { useZoom } from '../../providers/ZoomProvider/ZoomProvider';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const Grid = ({ center }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridCanvasRef = useRef<GridClass | null>(null);
  const { zoomLevel } = useZoom();

  useEffect(() => {
    if (!canvasRef.current || !center || gridCanvasRef.current) return;

    gridCanvasRef.current = new GridClass(center, canvasRef.current);

    const grid = gridCanvasRef.current;

    return () => {
      grid.teardown();
    };
  }, [center]);

  useEffect(() => {
    if (!gridCanvasRef.current) return;

    gridCanvasRef.current.zoom = zoomLevel;
  }, [zoomLevel]);

  if (!center) return null;

  return (
    <canvas
      className={styles.grid}
      ref={canvasRef}
    />
  );
};
