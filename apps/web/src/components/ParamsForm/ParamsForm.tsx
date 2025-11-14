import { useActionState, useEffect, useState, type ChangeEvent, type MouseEvent } from 'react';
import {
  ClientEvents,
  ServerEvents,
  type PositionPayload,
  type StartPositionPayload,
} from 'socket/types';
import { clientSocket } from '../../lib/clientSocket';
import { useZoom } from '../../providers/ZoomProvider/ZoomProvider';
import { ddToDmsFormatted } from '../../utils/ddToDms';
import styles from './ParamsForm.module.css';

const startPosition: StartPositionPayload = {
  position: {
    lat: 52.95138889,
    long: 4.79861045693137,
  },

  // middle of minutes
  // lat: 52.95833333,
  // long: 4.775,
  // long: 2.4340053543,

  speed: 12,
  heading: 289,
};

const initialPositionState = {
  ...startPosition,
  distance: 0,
};

export const ParamsForm = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [formState, setFormState] = useState(initialPositionState);
  const { zoomLevel, updateZoomLevel, resetZoomLevel } = useZoom();

  useEffect(() => {
    clientSocket.emit(ClientEvents.INIT, initialPositionState);

    const updatePosition = ({ position, distance, heading }: PositionPayload) => {
      const { lat, long } = position;

      updateStateValue('lat', lat);
      updateStateValue('long', long);
      updateStateValue('distance', distance);
      updateStateValue('heading', heading);
    };

    const reset = () => {
      resetZoomLevel();
    };

    clientSocket.on(ServerEvents.POSITION, updatePosition);
    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.off(ServerEvents.POSITION, updatePosition);
      clientSocket.off(ServerEvents.RESET, reset);
    };
  }, [resetZoomLevel, updateZoomLevel]);

  const [, submitAction] = useActionState(
    (_previousState: null, formData: Iterable<[PropertyKey, unknown]>) => {
      const entries = Object.fromEntries(formData);
      const lat = Number(entries.lat);
      const long = Number(entries.long);
      const speed = Number(entries.speed);
      const heading = Number(entries.heading);

      const position = { lat, long };
      clientSocket.emit(ClientEvents.START, { position, speed, heading });
      setIsTracking(true);

      return null;
    },
    null,
  );

  function updateStateValue(name: string, value: number) {
    setFormState((prevState) => {
      const newState = {
        ...prevState,
        [name]: value,
      };

      return newState;
    });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name } = event.target;
    let value: number | string = event.target.value;

    if (!name || !value) {
      throw new Error('Invalid input');
    }

    if (name === 'heading' && (Number(value) < 1 || Number(value) > 360)) {
      if (Number(value) < 1) {
        value = 360;
      }

      if (Number(value) > 360) {
        value = 1;
      }
    }

    updateStateValue(name, Number(value));

    clientSocket.emit(ClientEvents.INIT, {
      ...formState,
      [name]: Number(value),
    });
  }

  function stopTracking(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    clientSocket.emit(ClientEvents.STOP);
    setIsTracking(false);
  }

  function resetTracking(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    clientSocket.emit(ClientEvents.RESET);
    setFormState(initialPositionState);
  }

  function onZoomChange(event: ChangeEvent<HTMLInputElement>) {
    const value = Number(event.target.value);
    updateZoomLevel(value);
  }

  return (
    <div className={styles.paramsForm}>
      <form action={submitAction}>
        <label>
          Latitude
          <input
            disabled={isTracking}
            name="lat"
            onChange={handleChange}
            step="0.000001"
            type="number"
            value={formState.position.lat}
          />
          <small>{ddToDmsFormatted(formState.position.lat)}</small>
        </label>

        <label>
          Longitude
          <input
            disabled={isTracking}
            name="long"
            onChange={handleChange}
            step="0.0000001"
            type="number"
            value={formState.position.long}
          />
          <small>{ddToDmsFormatted(formState.position.long)}</small>
        </label>

        <label>
          Speed (kts)
          <input
            disabled={isTracking}
            name="speed"
            onChange={handleChange}
            step="1"
            type="number"
            value={formState.speed}
          />
        </label>

        <label>
          Heading (degrees)
          <input
            disabled={isTracking}
            name="heading"
            onChange={handleChange}
            step="1"
            type="number"
            value={formState.heading}
          />
        </label>

        <button
          type="submit"
          disabled={isTracking}>
          Start MOB
        </button>

        <button
          disabled={!isTracking}
          onClick={stopTracking}>
          Stop
        </button>

        <button onClick={resetTracking}>Reset</button>

        <label>
          Zoom level ({zoomLevel})
          <input
            id="zoomLevel"
            name="zoomLevel"
            max="10"
            min={1}
            onChange={onZoomChange}
            step="1"
            type="range"
            value={zoomLevel}
          />
        </label>
        <div>Distance: {formState.distance.toFixed(0)} meters</div>
      </form>
    </div>
  );
};
