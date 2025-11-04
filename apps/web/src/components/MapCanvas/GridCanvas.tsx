import { useEffect, useRef } from 'react';
import { Grid } from '../../lib/Grid';
import { useZoom } from '../../providers/ZoomProvider/ZoomProvider';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const GridCanvas = ({ center }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridCanvasRef = useRef<Grid | null>(null);
  const { zoomLevel } = useZoom();

  useEffect(() => {
    if (!canvasRef.current || !center) return;

    gridCanvasRef.current = new Grid(center, canvasRef.current);

    const gridCanvas = gridCanvasRef.current;

    return () => {
      gridCanvas.teardown();
    };
  }, [center]);

  useEffect(() => {
    if (!gridCanvasRef.current) return;

    // gridCanvasRef.current.zoom = zoomLevel;
  }, [zoomLevel]);

  if (!center) return null;

  console.log({ center });

  return <canvas className={styles.gridCanvas} ref={canvasRef} />;
};
