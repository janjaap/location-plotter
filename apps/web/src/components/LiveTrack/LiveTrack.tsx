import { useCallback, useEffect, useState } from 'react';
import {
  ServerEvents,
  type Coordinate,
  type PositionPayload,
  type StartPositionPayload,
} from 'socket/types';
import { clientSocket } from '../../lib/clientSocket';
import { rotationFromHeading } from '../../lib/rotationFromHeading';
import { MapCanvas } from '../MapCanvas/MapCanvas';
import styles from './LiveTrack.module.css';

export const LiveTrack = () => {
  const [center, setCenter] = useState<Coordinate | null>(null);
  const [needleRotation, setNeedleRotation] = useState<number | null>(null);

  const updatePosition = useCallback(
    ({ heading }: PositionPayload) => {
      if (needleRotation === null) return;

      const rotation = rotationFromHeading(needleRotation, heading);

      setNeedleRotation(rotation);
    },
    [needleRotation],
  );

  useEffect(() => {
    const init = ({ position, heading }: PositionPayload) => {
      setCenter(position);
      setNeedleRotation(heading);
    };

    const marker = (position: Coordinate) => {
      setCenter(position);
    };

    const reset = ({ lat, long, heading }: StartPositionPayload) => {
      setNeedleRotation(heading);
      setCenter({ lat, long });
    };

    const stopped = () => {
      setCenter(null);
    };

    clientSocket.on(ServerEvents.INIT, init);
    clientSocket.on(ServerEvents.MARKER, marker);
    clientSocket.on(ServerEvents.RESET, reset);
    clientSocket.on(ServerEvents.STOPPED, stopped);

    return () => {
      clientSocket.off(ServerEvents.INIT, init);
      clientSocket.off(ServerEvents.MARKER, marker);
      clientSocket.off(ServerEvents.RESET, reset);
      clientSocket.off(ServerEvents.STOPPED, stopped);
    };
  }, []);

  useEffect(() => {
    clientSocket.on(ServerEvents.POSITION, updatePosition);

    return () => {
      clientSocket.off(ServerEvents.POSITION, updatePosition);
    };
  }, [updatePosition]);

  return (
    <div className={styles.liveTrack}>
      {needleRotation && (
        <span className={styles.compass}>
          <span className={styles.eastWestRing} />
          <span
            className={styles.needle}
            style={{ transform: `rotateZ(${needleRotation}deg)` }}
          />
        </span>
      )}

      {center && <div className={styles.mobMarker} />}

      <MapCanvas />
    </div>
  );
};
