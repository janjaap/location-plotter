import { useParams } from '@providers/ParamsProvider/ParamsProvider';
import styles from './Zoom.module.css';

export const Zoom = () => {
  const { zoomLevel, updateZoomLevel } = useParams();

  const increaseZoom = () => {
    updateZoomLevel(zoomLevel + 1);
  };

  const decreaseZoom = () => {
    if (zoomLevel === 1) return;

    updateZoomLevel(zoomLevel - 1);
  };

  return (
    <div className={styles.zoomContainer}>
      <button
        disabled={zoomLevel === 1}
        onClick={decreaseZoom}
      >
        -
      </button>
      <span className={styles.zoomLevel}>{zoomLevel}</span>
      <button
        disabled={zoomLevel === 10}
        onClick={increaseZoom}
      >
        +
      </button>
    </div>
  );
};
