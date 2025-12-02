import { ServerEvents } from '@milgnss/utils/types';
import { useEffect, useRef, useState } from 'react';
import { clientSocket } from '../../lib/clientSocket';
import { Grid as GridClass } from '../../lib/Grid';
import { useParams } from '../../providers/ParamsProvider/ParamsProvider';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const Grid = ({ center }: CanvasProps) => {
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<GridClass | null>(null);
  const { offset } = useParams();

  useEffect(() => {
    if (!gridCanvasRef.current || grid) return;

    const gridInstance = new GridClass(center, gridCanvasRef.current);
    setGrid(gridInstance);
  }, [center, center.lat, center.long, grid]);

  useEffect(() => {
    if (!grid || (!offset.x && !offset.y)) return;

    grid.offset = offset;
  }, [grid, offset]);

  useEffect(() => {
    if (!gridCanvasRef.current) return;

    const reset = () => {
      if (!grid) return;

      grid.drawGrid(true);
    };

    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.offAny(reset);
    };
  }, [grid]);

  return (
    <canvas
      className={styles.grid}
      ref={gridCanvasRef}
    />
  );
};
