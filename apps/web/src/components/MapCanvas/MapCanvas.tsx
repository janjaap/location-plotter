import { useEffect, useState } from 'react';
import { ServerEvents, type Coordinate, type PositionPayload } from 'socket/types';
import { clientSocket } from '../../lib/clientSocket';
import { Grid } from './Grid';
import styles from './MapCanvas.module.css';
import { Ship } from './Ship';
import { TrackCanvas } from './TrackCanvas';

export type CanvasProps = {
  center: Coordinate | null;
};

export const MapCanvas = () => {
  const [center, setCenter] = useState<Coordinate | null>(null);

  useEffect(() => {
    const init = ({ position }: PositionPayload) => {
      setCenter(position);
    };

    const reset = (resetPosition: Coordinate) => {
      setCenter(resetPosition);
    };

    clientSocket.on(ServerEvents.INIT, init);
    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.off(ServerEvents.INIT, init);
      clientSocket.off(ServerEvents.RESET, reset);
    };
  }, []);

  return (
    <div className={styles.mapCanvasContainer}>
      <div className={styles.canvasContainer}>
        <Grid center={center} />
        <TrackCanvas center={center} />
        <Ship center={center} />
      </div>
    </div>
  );
};
