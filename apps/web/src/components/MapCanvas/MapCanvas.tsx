import { useRef } from 'react';

import { Zoom } from '@components/Zoom/Zoom';
import { useMapCanvas } from '../../hooks/useMapCanvas';
// import { Compass } from '../Compass/Compass';
import { Duration } from '../Duration/Duration';
import { Grid } from '../Grid/Grid';
import { Ship } from '../Ship/Ship';
import { Track } from '../Track/Track';
import styles from './MapCanvas.module.css';

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
      {/* <Compass /> */}
      <Duration />
      <Zoom />
      <Grid />
      <Track />
      <Ship />
    </div>
  );
};
