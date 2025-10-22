import { useState, type ChangeEvent } from "react";
import { ServerEvents, type Coordinate } from "socket/types";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { GridCanvas } from "./GridCanvas";
import styles from './MapCanvas.module.css';
import { TrackCanvas } from "./TrackCanvas";

const initialState = {
  zoomLevel: 1,
};

export const MapCanvas = () => {
  const [center, setCenter] = useState<Coordinate | null>(null);
  const [formState, setFormState] = useState(initialState);

  useSocketEvent(ServerEvents.INIT, (initPosition) => {
    setCenter(initPosition);
  });

  const handleZoomLevelChange = (event: ChangeEvent<HTMLInputElement>) => {
    const zoomLevel = Number(event.target.value);
    setFormState({ ...formState, zoomLevel });
  };

  return (
    <div className={styles.mapCanvasContainer}>
      <div className={styles.canvasContainer}>
        <GridCanvas center={center} zoomLevel={formState.zoomLevel} />
        <TrackCanvas center={center} zoomLevel={formState.zoomLevel} />
      </div>

      <div className={styles.gridCanvasForm}>
        <form>
          <div>
            <div className={styles.inlineLabel}>
              <label>Zoom level ({formState.zoomLevel})</label>
              {formState.zoomLevel !== initialState.zoomLevel && (
                <button className="small" type="button" onClick={() => setFormState({ ...formState, zoomLevel: initialState.zoomLevel })}>
                  Reset
                </button>
              )}
            </div>

            <input type="range" min="1" max="10" step="0.1" value={formState.zoomLevel} onChange={handleZoomLevelChange} />
          </div>
        </form>
      </div>
    </div>
  );
}
