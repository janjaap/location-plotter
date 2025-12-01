import { useEffect, useState } from 'react';
import { clientSocket } from '../../lib/clientSocket';
import styles from './DisconnectionWarning.module.css';

export const DisconnectionWarning = () => {
  const [isDisconnected, setIsDisconnected] = useState(false);

  useEffect(() => {
    clientSocket.on('connect', () => {
      setIsDisconnected(false);
    });

    clientSocket.on('disconnect', () => {
      setIsDisconnected(true);
    });
  }, []);

  useEffect(() => {
    if (!isDisconnected) return;

    const timer = setTimeout(() => {
      clientSocket.connect();
    }, 1_000);

    return () => clearTimeout(timer);
  }, [isDisconnected]);

  if (!isDisconnected) return null;

  return <div className={styles.warning}>Disconnected from server</div>;
};
