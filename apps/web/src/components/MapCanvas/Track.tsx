import { useRef } from 'react';
import { trackColor } from '../../lib/tokens';

import { useSvgTrack } from '../../hooks/useSvgTrack';
import styles from './MapCanvas.module.css';

export const Track = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    viewBox,
    // points,
    path,
  } = useSvgTrack({ svgRef });

  return (
    <svg
      ref={svgRef}
      className={styles.track}
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
    >
      {/* <polyline
        points={points}
        fill="none"
        stroke={trackColor}
        strokeDasharray={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      /> */}
      <path
        d={path}
        stroke={trackColor}
        fill="none"
        strokeDasharray={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
