import { useCallback, useEffect, useState } from 'react';
import {
  ServerEvents,
  type Coordinate,
  type PositionPayload,
  type StartPositionPayload,
} from 'socket/types';
import { clientSocket } from '../../lib/clientSocket';
import { rotationFromHeading } from '../../utils/rotationFromHeading';
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

    const reset = ({ lat, long, heading }: StartPositionPayload) => {
      setNeedleRotation(heading);
      setCenter({ lat, long });
    };

    clientSocket.on(ServerEvents.INIT, init);
    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.off(ServerEvents.INIT, init);
      clientSocket.off(ServerEvents.RESET, reset);
    };
  }, []);

  useEffect(() => {
    clientSocket.on(ServerEvents.POSITION, updatePosition);

    return () => {
      clientSocket.off(ServerEvents.POSITION, updatePosition);
    };
  }, [updatePosition]);

  if (!center) return null;

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

      <MapCanvas center={center} />
    </div>
  );
};
