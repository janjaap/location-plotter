import { useCallback, useEffect, useRef, useState } from 'react';
import { ServerEvents, type Coordinate, type PositionPayload } from 'socket/types';
import { Canvas } from '../../lib/canvas';
import { clientSocket } from '../../lib/clientSocket';
import { trackColor } from '../../lib/tokens';
import { useParams } from '../../providers/ParamsProvider/ParamsProvider';
import type { GridPoint } from '../../types';
import { gridCoordinate } from '../../utils/gridCoordinate';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

type ViewBox = {
  width: number;
  height: number;
};

export const Track = ({ center }: CanvasProps) => {
  const trackRef = useRef<SVGSVGElement>(null);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [viewBox, setViewBox] = useState<ViewBox>({ width: 0, height: 0 });
  const { offset } = useParams();

  const convertPositionToGridPoint = useCallback(
    (position: Coordinate): GridPoint => {
      const pixelsPerLongSecond = Canvas.PIXELS_PER_LONG_SECOND;
      const pixelsPerLatSecond = Canvas.PIXELS_PER_LAT_SECOND;

      const { x, y } = gridCoordinate({
        position,
        reference: center,
        pixelsPerLatSecond,
        pixelsPerLongSecond,
        offset,
      });

      return {
        x: x + viewBox.width / 2,
        y: y + viewBox.height / 2,
      };
    },
    [center, offset, viewBox.height, viewBox.width],
  );

  const pointsList = useCallback(
    (asPath = false) =>
      coordinates.reduce(
        (acc, position) => {
          const { x, y } = convertPositionToGridPoint(position);

          if (!x && !y) return acc;

          return (acc += `${asPath ? 'L' : ' '}${x} ${y}`);
        },
        `${asPath ? 'M' : ''}${viewBox.width / 2} ${viewBox.height / 2}`,
      ),
    [convertPositionToGridPoint, coordinates, viewBox.height, viewBox.width],
  );

  useEffect(() => {
    if (!trackRef.current) return;

    const { width, height } = trackRef.current.getBoundingClientRect();

    setViewBox({ width, height });
  }, []);

  useEffect(() => {
    const setGridPoint = ({ position }: PositionPayload) => {
      setCoordinates((prev) => {
        const last = prev[prev.length - 1];

        if (last?.lat === position.lat && last?.long === position.long) {
          return prev;
        }

        return [...prev, position];
      });
    };

    const reset = () => {
      setCoordinates([]);
    };

    clientSocket.on(ServerEvents.POSITION, setGridPoint);
    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.off(ServerEvents.POSITION, setGridPoint);
      clientSocket.offAny(reset);
    };
  }, []);

  return (
    <svg
      ref={trackRef}
      className={styles.track}
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
    >
      {/* <polyline
        points={pointsList()}
        fill="none"
        stroke={trackColor}
        strokeDasharray={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      /> */}
      <path
        d={pointsList(true)}
        stroke={trackColor}
        fill="none"
        strokeDasharray={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
