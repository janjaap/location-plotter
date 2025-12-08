import { type Coordinate } from '@milgnss/utils/types';
import { useRef } from 'react';

import { MobDirection } from '@components/MobDirection/MobDirection';
import { useMapCanvas } from '../../hooks/useMapCanvas';
import { Compass } from '../Compass/Compass';
import { Duration } from '../Duration/Duration';
import { Grid } from '../Grid/Grid';
import { Ship } from '../Ship/Ship';
import { Track } from '../Track/Track';
import styles from './MapCanvas.module.css';

export type CanvasProps = {
  center: Coordinate;
};

export const MapCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { onDragStart, onDrag, onDragEnd } = useMapCanvas({ containerRef });

  return (
    <div
      className={styles.mapCanvas}
      onMouseDown={onDragStart}
      onMouseMove={onDrag}
      onMouseUp={onDragEnd}
      ref={containerRef}
    >
      <MobDirection />
      <Compass />
      <Duration />
      <Grid />
      <Track />
      <Ship />
    </div>
  );
};
