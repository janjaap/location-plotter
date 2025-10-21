import { useState } from 'react';
import { ServerEvents, type Coordinate } from 'socket/types';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { ddToDmsFormatted } from '../../utils/ddToDms';
import { MapCanvas } from '../MapCanvas/MapCanvas';
import styles from './LiveTrack.module.css';

export const LiveTrack = () => {
  const [center, setCenter] = useState<Coordinate | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [bearing, setBearing] = useState<number>(0);

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
    setBearing(0);
  });

  useSocketEvent(ServerEvents.STOPPED, () => {
    setCenter(null);
  });

  useSocketEvent(ServerEvents.POSITION, ({ heading: currentHeading }) => {
    if (heading === null) return;

    const newBearing = heading - currentHeading;
    setBearing(newBearing);
  });

  return (
    <div className={styles.liveTrack}>
      {heading && <span className={styles.needle} style={{ transform: `translate(97cqw, 1cqh) rotateZ(${heading + bearing}deg)` }} />}

      {center && (
        <div className={styles.mobMarker}>
          {ddToDmsFormatted(center.lat)}<br />
          {ddToDmsFormatted(center.long)}
        </div>
      )}

      <MapCanvas />
    </div>
  )
}
