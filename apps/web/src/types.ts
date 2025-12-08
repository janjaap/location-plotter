import type { RefObject } from 'react';
import { Grid } from './lib/Grid';
import { Ship } from './lib/Ship';

export interface UseCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export type CanvasEntity = Ship | Grid | null;
