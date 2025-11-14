import { useEffect } from 'react';
import { ServerEvents, type Coordinate } from 'socket/types';
import { clientSocket } from '../../lib/clientSocket';
import { useZoom } from '../../providers/ZoomProvider/ZoomProvider';
import { Grid } from './Grid';
import styles from './MapCanvas.module.css';
import { Ship } from './Ship';
import { Track } from './Track';

export type CanvasProps = {
  center: Coordinate;
};

export const MapCanvas = ({ center }: CanvasProps) => {
  const { updateZoomLevel } = useZoom();

  useEffect(() => {
    clientSocket.on(ServerEvents.ZOOM, updateZoomLevel);

    return () => {
      clientSocket.off(ServerEvents.ZOOM, updateZoomLevel);
    };
  }, [updateZoomLevel]);

  return (
    <div className={styles.canvasContainer}>
      <Grid center={center} />
      <Track center={center} />
      <Ship center={center} />
    </div>
  );
};
