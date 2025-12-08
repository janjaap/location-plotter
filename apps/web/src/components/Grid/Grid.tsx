import { useRef } from 'react';
import { useCanvasGrid } from '../../hooks/useCanvasGrid';
import styles from './Grid.module.css';

export const Grid = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useCanvasGrid({ canvasRef });

  return (
    <canvas
      className={styles.grid}
      ref={canvasRef}
    />
  );
};
