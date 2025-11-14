import { useEffect, useRef, useState } from 'react';
import { ServerEvents, type Coordinate, type PositionPayload } from 'socket/types';
import { Canvas, zoomLevelToFactor } from '../../lib/canvas';
import { clientSocket } from '../../lib/clientSocket';
import { useZoom } from '../../providers/ZoomProvider/ZoomProvider';
import { gridCoordinate } from '../../utils/gridCoordinate';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

export const Track = ({ center }: CanvasProps) => {
  const trackRef = useRef<SVGSVGElement>(null);
  const { zoomLevel } = useZoom();
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [viewBox, setViewBox] = useState<{ width: number; height: number }>();

  const zoomFactor = zoomLevelToFactor(zoomLevel);

  const convertPositionToGridPoint = (position: Coordinate) => {
    if (!viewBox) return {};

    const width =
      viewBox.width - Canvas.LABEL_WIDTH - Canvas.CANVAS_PADDING - Canvas.CANVAS_PADDING;
    const height = viewBox.height - Canvas.LABEL_HEIGHT - Canvas.CANVAS_PADDING;

    const pixelsPerLongSecond = (width / Canvas.VISIBLE_SECONDS) * zoomFactor;
    const pixelsPerLatSecond = (height / Canvas.VISIBLE_SECONDS) * zoomFactor;

    const { x, y } = gridCoordinate({
      position,
      reference: center!,
      pixelsPerLatSecond,
      pixelsPerLongSecond,
    });

    return { x: x + viewBox.width / 2, y: y + viewBox.height / 2 };
  };

  const svgPath = viewBox
    ? coordinates.reduce(
        (acc, position) => {
          const { x, y } = convertPositionToGridPoint(position);

          if (!x && !y) return acc;

          return (acc += ` L${x} ${y}`);
        },
        `M${viewBox.width / 2} ${viewBox.height / 2}`,
      )
    : '';

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
      clientSocket.off(ServerEvents.RESET, reset);
    };
  }, []);

  return (
    <svg
      ref={trackRef}
      className={styles.track}
      viewBox={`0 0 ${viewBox?.width ?? 0} ${viewBox?.height ?? 0}`}>
      <path
        d={svgPath}
        stroke="red"
        fill="transparent"
      />
    </svg>
  );
};
