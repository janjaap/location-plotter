import { Grid as GridClass } from '@lib/Grid';
import { useEffect, useState } from 'react';
import type { UseCanvasProps } from '../types';
import { useOffset } from './useOffset';
import { usePosition } from './usePosition';
import { useReset } from './useReset';
import { useZoomLevel } from './useZoomLevel';

export const useCanvasGrid = ({ canvasRef }: UseCanvasProps) => {
  const [grid, setGrid] = useState<GridClass | null>(null);
  const { startPosition } = usePosition();

  useOffset(grid);
  useZoomLevel(grid);
  useReset(grid);

  useEffect(() => {
    if (!canvasRef.current || grid || !startPosition) return;

    const gridInstance = new GridClass(startPosition, canvasRef.current);
    setGrid(gridInstance);
  }, [startPosition, grid, canvasRef]);
};
