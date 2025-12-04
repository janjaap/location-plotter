import { useNeedleRotation } from '../../hooks/useNeedleRotation';
import styles from './Compass.module.css';

export const Compass = () => {
  const needleRotation = useNeedleRotation();

  return (
    <span className={styles.compass}>
      <span className={styles.eastWestRing} />
      <span
        className={styles.needle}
        style={{ transform: `rotateZ(${needleRotation}deg)` }}
      />
    </span>
  );
};
