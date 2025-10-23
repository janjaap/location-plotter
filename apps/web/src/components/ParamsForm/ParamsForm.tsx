import { useActionState, useEffect, useState, type ChangeEvent, type MouseEvent } from "react";
import { ClientEvents, ServerEvents, type StartPositionPayload } from "socket/types";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { clientSocket } from "../../lib/clientSocket";
import styles from './ParamsForm.module.css';

const startPosition: StartPositionPayload = {
  lat: 52.95138889,
  long: 4.798795456931373,

  // middle of minutes
  // lat: 52.95833333,
  // long: 4.775,
  // long: 2.4353453543,

  speed: 12,
  heading: 289,
};

const initialPositionState = {
  ...startPosition,
  distance: 0,
}

export const ParamsForm = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [formState, setFormState] = useState(initialPositionState);

  useEffect(() => {
    clientSocket.emit(ClientEvents.INIT, initialPositionState);
  }, []);

  useSocketEvent(ServerEvents.POSITION, ({ position, distance, heading }) => {
    const { lat, long } = position;

    updateStateValue('lat', lat);
    updateStateValue('long', long);
    updateStateValue('distance', distance);
    updateStateValue('heading', heading);
  });

  const [, submitAction] = useActionState(
    (_previousState: null, formData: Iterable<[PropertyKey, unknown]>) => {
      const entries = Object.fromEntries(formData);
      const lat = Number(entries.lat);
      const long = Number(entries.long);
      const speed = Number(entries.speed);
      const heading = Number(entries.heading);

      clientSocket.emit(ClientEvents.START, { lat, long, speed, heading });
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

    if (name === 'heading' && (Number(value) < 1 || Number(value) > 360)) {
      if (Number(value) < 1) {
        value = 360;
      }

      if (Number(value) > 360) {
        value = 1;
      }
    }

    updateStateValue(name, Number(value));

    // clientSocket.emit(ClientEvents.INIT, { ...formState, [name]: Number(value) });
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

  return (
    <div className={styles.paramsForm}>
      <form action={submitAction}>
        <label>Latitude
          <input type="number" name="lat" value={formState.lat} step="0.000001" onChange={handleChange} />
        </label>

        <label>Longitude
          <input type="number" name="long" value={formState.long} step="0.0000001" onChange={handleChange} />
        </label>

        <label>Speed (kts)
          <input type="number" name="speed" value={formState.speed} step="0.1" onChange={handleChange} />
        </label>

        <label>Heading (degrees)
          <input type="number" name="heading" value={formState.heading} step="1" onChange={handleChange} />
        </label>

        <button type="submit" disabled={isTracking}>Start</button>

        <button disabled={!isTracking} onClick={stopTracking}>
          Stop
        </button>

        <button onClick={resetTracking}>
          Reset
        </button>
      </form>

      <div>
        Distance: {formState.distance.toFixed(0)} meters
      </div>
    </div>
  );
}
