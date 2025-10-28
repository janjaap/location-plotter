import { useState, type ChangeEvent } from 'react';
import { ServerEvents, type Coordinate } from 'socket/types';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { GridCanvas } from './GridCanvas';
import styles from './MapCanvas.module.css';
import { TrackCanvas } from './TrackCanvas';
import { TrackIndicatorCanvas } from './TrackIndicatorCanvas';

const initialState = {
  zoomLevel: 1,
};

export type CanvasProps = {
  center: Coordinate | null;
  zoomLevel: number;
};

export const MapCanvas = () => {
  const [center, setCenter] = useState<Coordinate | null>(null);
  const [formState, setFormState] = useState(initialState);

  useSocketEvent(ServerEvents.INIT, (initPosition) => {
    setCenter(initPosition);
  });

  useSocketEvent(ServerEvents.RESET, (initPosition) => {
    setCenter(initPosition);
    setFormState({ ...formState, zoomLevel: 1 });
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
        <TrackIndicatorCanvas center={center} zoomLevel={formState.zoomLevel} />
      </div>

      <div className={styles.gridCanvasForm}>
        <form>
          <div>
            <div className={styles.inlineLabel}>
              <label>Zoom level ({formState.zoomLevel})</label>
              <button
                disabled={formState.zoomLevel === initialState.zoomLevel}
                className="small"
                type="button"
                onClick={() =>
                  setFormState({
                    ...formState,
                    zoomLevel: initialState.zoomLevel,
                  })
                }
              >
                Reset
              </button>
            </div>

            <input
              type="range"
              min="0.5"
              max="20"
              step="0.1"
              value={formState.zoomLevel}
              onChange={handleZoomLevelChange}
            />
          </div>
        </form>
      </div>
    </div>
  );
};
