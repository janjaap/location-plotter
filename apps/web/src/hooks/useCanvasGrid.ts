import { Grid as GridClass } from '@lib/Grid';
import { useEffect, useState } from 'react';
import type { UseCanvasProps } from '../types';
import { useCenter } from './useCenter';
import { useOffset } from './useOffset';
import { useReset } from './useReset';
import { useZoomLevel } from './useZoomLevel';

export const useCanvasGrid = ({ canvasRef }: UseCanvasProps) => {
  const [grid, setGrid] = useState<GridClass | null>(null);
  const center = useCenter();

  useOffset(grid);
  useZoomLevel(grid);
  useReset(grid);

  useEffect(() => {
    if (!canvasRef.current || grid || !center) return;

    const gridInstance = new GridClass(center, canvasRef.current);
    setGrid(gridInstance);
  }, [center, grid, canvasRef]);
};
