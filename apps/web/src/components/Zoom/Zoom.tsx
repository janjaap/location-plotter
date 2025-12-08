import { useParams } from '@providers/ParamsProvider/ParamsProvider';
import styles from './Zoom.module.css';

export const Zoom = () => {
  const { zoomFactor, updateZoomFactor } = useParams();

  const increaseZoom = () => {
    updateZoomFactor(zoomFactor + 1);
  };

  const decreaseZoom = () => {
    if (zoomFactor === 1) return;

    updateZoomFactor(zoomFactor - 1);
  };

  return (
    <div className={styles.zoomContainer}>
      <button
        disabled={zoomFactor === 1}
        onClick={decreaseZoom}
      >
        -
      </button>
      <span className={styles.zoomFactor}>{zoomFactor}</span>
      <button onClick={increaseZoom}>+</button>
    </div>
  );
};
