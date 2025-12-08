import { useRef } from 'react';
import { useCanvasShip } from '../../hooks/useCanvasShip';
import styles from './MapCanvas.module.css';

export const Ship = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useCanvasShip({ canvasRef });

  return (
    <canvas
      className={styles.ship}
      ref={canvasRef}
    />
  );
};
