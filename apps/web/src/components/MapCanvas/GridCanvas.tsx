import { useEffect, useRef } from 'react';
import type { Coordinate } from 'socket/types';
import { CanvasGrid } from '../../lib/canvasGrid';
import styles from './MapCanvas.module.css';

interface Props {
  center: Coordinate | null;
  zoomLevel: number;
}

export const GridCanvas = ({ center, zoomLevel }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridCanvasRef = useRef<CanvasGrid | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !center) return;

    gridCanvasRef.current = new CanvasGrid(center, canvasRef.current);
    gridCanvasRef.current.init();

    return gridCanvasRef.current.teardown;
  }, [center]);

  useEffect(() => {
    if (!gridCanvasRef.current) return;

    gridCanvasRef.current.subdivisions = zoomLevel;
    gridCanvasRef.current.zoomLevel = zoomLevel;
  }, [zoomLevel]);

  return <canvas className={styles.gridCanvas} ref={canvasRef}></canvas>;
}
