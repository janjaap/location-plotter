import { type Coordinate } from '@milgnss/utils/types';
import { useRef } from 'react';

import { useMapCanvas } from '../../hooks/useMapCanvas';
import { Compass } from '../Compass/Compass';
import { Duration } from '../Duration/Duration';
import { Grid } from './Grid';
import styles from './MapCanvas.module.css';
import { Ship } from './Ship';
import { Track } from './Track';

export type CanvasProps = {
  center: Coordinate;
};

export const MapCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { onDragStart, onDrag, onDragEnd } = useMapCanvas({ containerRef });

  return (
    <div
      className={styles.canvasContainer}
      ref={containerRef}
    >
      <div
        onMouseDown={onDragStart}
        onMouseMove={onDrag}
        onMouseUp={onDragEnd}
      >
        <Compass />
        <Duration />
        <Grid />
        <Track />
        <Ship />
      </div>
    </div>
  );
};
