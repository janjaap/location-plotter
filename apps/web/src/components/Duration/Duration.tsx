import { ServerEvents } from '@milgnss/utils/types';
import { useEffect, useState } from 'react';
import { clientSocket } from '../../lib/clientSocket';
import styles from './Duration.module.css';

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

let durationInterval: number;

export const Duration = () => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const start = () => {
      if (durationInterval) return;

      durationInterval = window.setInterval(() => {
        setDuration((prevDuration) => prevDuration + 1);
      }, 1_000);
    };

    const stop = () => {
      clearInterval(durationInterval);
    };

    const reset = () => {
      setDuration(0);
      clearInterval(durationInterval);
    };

    clientSocket.on(ServerEvents.STOPPED, stop);
    clientSocket.on(ServerEvents.POSITION, start);
    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.offAny(stop);
      clientSocket.offAny(start);
      clientSocket.offAny(reset);
      clearInterval(durationInterval);
    };
  }, []);

  return <span className={styles.duration}>{formatDuration(duration)}</span>;
};
