import { useEffect, useRef } from 'react';
import { type Coordinate } from 'socket/types';
import { CanvasGrid } from '../../lib/canvasGrid';
import styles from './MapCanvas.module.css';

interface Props {
  center: Coordinate | null;
  zoomLevel: number;
}

export const GridCanvas = ({ center, zoomLevel }: Props) => {
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!gridCanvasRef.current || !center) return;

    const grid = new CanvasGrid(center, gridCanvasRef.current);

    grid.subdivisions = zoomLevel;
    grid.zoomLevel = zoomLevel;
    grid.init();

    return grid.teardown;
  }, [center, zoomLevel]);

  return <canvas className={styles.gridCanvas} ref={gridCanvasRef}></canvas>;
}
