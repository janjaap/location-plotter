import { useState } from 'react';
import { ServerEvents, type Coordinate } from 'socket/types';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { MapCanvas } from '../MapCanvas/MapCanvas';
import styles from './LiveTrack.module.css';

export const LiveTrack = () => {
  const [center, setCenter] = useState<Coordinate | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  useSocketEvent(ServerEvents.INIT, (initPosition, _distance, initHeading) => {
    setCenter(initPosition);
    setHeading(initHeading);
  });

  useSocketEvent(ServerEvents.MARKER, (position) => {
    setCenter(position);
  });

  useSocketEvent(ServerEvents.RESET, ({ heading }) => {
    setHeading(heading);
    setCenter(null);
  });

  useSocketEvent(ServerEvents.STOPPED, () => {
    setCenter(null);
  });

  useSocketEvent(ServerEvents.POSITION, ({ heading: currentHeading }) => {
    if (heading === null) return;

    setHeading(currentHeading);
  });

  return (
    <div className={styles.liveTrack}>
      {heading && <span className={styles.needle} style={{ transform: `translate(97cqw, 1cqh) rotateZ(${heading}deg)` }} />}

      {center && (
        <div className={styles.mobMarker}>
          {/* {ddToDmsFormatted(center.lat)}<br />
          {ddToDmsFormatted(center.long)} */}
        </div>
      )}

      <MapCanvas />
    </div>
  )
}
