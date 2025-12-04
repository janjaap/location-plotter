import { ServerEvents } from '@milgnss/utils/types';
import { useEffect, useState } from 'react';
import { clientSocket } from '../lib/clientSocket';
import { Grid as GridClass } from '../lib/Grid';
import { useParams } from '../providers/ParamsProvider/ParamsProvider';
import type { UseCanvasProps } from '../types';
import { useCenter } from './useCenter';

export const useCanvasGrid = ({ canvasRef }: UseCanvasProps) => {
  const [grid, setGrid] = useState<GridClass | null>(null);
  const { offset } = useParams();
  const center = useCenter();

  useEffect(() => {
    if (!canvasRef.current || grid || !center) return;

    const gridInstance = new GridClass(center, canvasRef.current);
    setGrid(gridInstance);
  }, [center, grid, canvasRef]);

  useEffect(() => {
    if (!grid || (!offset.x && !offset.y)) return;

    grid.offset = offset;
  }, [grid, offset]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const reset = () => {
      if (!grid) return;

      grid.drawGrid(true);
    };

    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.offAny(reset);
    };
  }, [grid, canvasRef]);
};
