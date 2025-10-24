import { useState } from 'react';
import { ServerEvents, type Coordinate } from 'socket/types';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { rotationFromHeading } from '../../lib/rotationFromHeading';
import { MapCanvas } from '../MapCanvas/MapCanvas';
import styles from './LiveTrack.module.css';

export const LiveTrack = () => {
  const [center, setCenter] = useState<Coordinate | null>(null);
  const [needleRotation, setNeedleRotation] = useState<number | null>(null);

  useSocketEvent(ServerEvents.INIT, (initPosition, _distance, initHeading) => {
    setCenter(initPosition);
    setNeedleRotation(initHeading);
  });

  useSocketEvent(ServerEvents.MARKER, (position) => {
    setCenter(position);
  });

  useSocketEvent(ServerEvents.RESET, ({ heading }) => {
    setNeedleRotation(heading);
    setCenter(null);
  });

  useSocketEvent(ServerEvents.STOPPED, () => {
    setCenter(null);
  });

  useSocketEvent(ServerEvents.POSITION, ({ heading }) => {
    if (needleRotation === null) return;

    const rotation = rotationFromHeading(needleRotation, heading);

    setNeedleRotation(rotation);
  });

  return (
    <div className={styles.liveTrack}>
      {needleRotation && (
        <span className={styles.compass}>
          <span className={styles.eastWestRing} />
          <span className={styles.needle} style={{ transform: `rotateZ(${needleRotation}deg)` }} />
        </span>
      )}

      {center && <div className={styles.mobMarker} />}

      <MapCanvas />
    </div>
  )
}
