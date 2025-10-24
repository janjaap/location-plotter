import { useEffect, useRef } from 'react';
import { CanvasGrid } from '../../lib/canvasGrid';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const GridCanvas = ({ center, zoomLevel }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridCanvasRef = useRef<CanvasGrid | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !center) return;

    gridCanvasRef.current = new CanvasGrid(center, canvasRef.current);

    return gridCanvasRef.current.teardown;
  }, [center]);

  useEffect(() => {
    if (!gridCanvasRef.current) return;

    gridCanvasRef.current.subdivisions = zoomLevel;
    gridCanvasRef.current.zoomLevel = zoomLevel;
  }, [zoomLevel]);

  return <canvas className={styles.gridCanvas} ref={canvasRef}></canvas>;
}
