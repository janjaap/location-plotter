import { useState } from "react";
import { ServerEvents, type Coordinate } from "socket/types";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { GridCanvas } from "./GridCanvas";
import styles from './MapCanvas.module.css';
import { TrackCanvas } from "./TrackCanvas";

export const MapCanvas = () => {
  const [center, setCenter] = useState<Coordinate | null>(null);

  useSocketEvent(ServerEvents.INIT, (initPosition) => {
    setCenter(initPosition);
  });

  return (
    <div className={styles.canvasContainer}>
      <GridCanvas center={center} />
      <TrackCanvas center={center} />
    </div>
  );
}
