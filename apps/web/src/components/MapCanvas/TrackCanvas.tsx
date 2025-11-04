import { useEffect, useState } from 'react';
import { ServerEvents, type PositionPayload } from 'socket/types';
import { clientSocket } from '../../lib/clientSocket';
import { gridCoordinate, type GridPoint } from '../../lib/gridCoordinate';
import { useZoom } from '../../providers/ZoomProvider/ZoomProvider';
import type { CanvasProps } from './MapCanvas';
import styles from './MapCanvas.module.css';

const viewBox = {
  width: 1024,
  height: 768,
};

export const TrackCanvas = ({ center }: CanvasProps) => {
  const { zoomLevel } = useZoom();
  const [gridPoints, setGridPoints] = useState<GridPoint[]>([]);

  useEffect(() => {
    if (!center) return;

    //   const resizeCallback = () => {
    //     const { width, height } = getCanvasDimensions();

    //     if (!width || !height) return;

    //     trackWorker.current.postMessage({
    //       message: MessageEnum.RESIZE,
    //       width,
    //       height,
    //     });
    //   };

    //   const observer = new ResizeObserver(resizeCallback);

    //   observer.observe(trackCanvasRef.current);
    const columnWidth = (viewBox.width / 3) * zoomLevel;
    const rowHeight = (viewBox.height / 3) * zoomLevel;

    const setGridPoint = ({ position }: PositionPayload) => {
      const { x, y } = gridCoordinate(position, center, columnWidth, rowHeight);
      const newGridPoint = { x: x + 512, y: y + 384 };

      setGridPoints((prev) => {
        const last = prev[prev.length - 1];

        if (last?.x === newGridPoint.x && last?.y === newGridPoint.y) {
          return prev;
        }

        return [...prev, newGridPoint];
      });
    };

    const reset = () => {
      setGridPoints([]);
    };

    clientSocket.on(ServerEvents.POSITION, setGridPoint);
    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.off(ServerEvents.POSITION, setGridPoint);
      clientSocket.off(ServerEvents.RESET, reset);
    };
  }, [center, zoomLevel]);

  const svgPath = gridPoints.reduce(
    (acc, point) => (acc += ` L${point.x} ${point.y}`),
    `M${viewBox.width / 2} ${viewBox.height / 2}`,
  );

  const xOffset1 = viewBox.width * (zoomLevel / 10 - 1);
  const yOffset1 = viewBox.height * (zoomLevel / 10 - 1);

  const xOffset2 = viewBox.width - viewBox.width * (zoomLevel / 10 - 1);
  const yOffset2 = viewBox.height - viewBox.height * (zoomLevel / 10 - 1);

  // zoomLevel: 10
  // xOffset1: 1024 - 1024 * (10 / 10) = 0
  // yOffset1: 768 - 768 * (10 / 10) = 0

  // zoomlevel: 11
  // xOffset1: 1024 - 1024 * (11 / 10) = -102.4
  // yOffset1: 768 - 768 * (11 / 10) = -76.8

  // xOffset2: 1024 * (11 / 10) = 1124.8
  // yOffset2: 768 * (11 / 10) = 844.8

  const vb = `
    ${Math.round(xOffset1)}
    ${Math.round(yOffset1)}
    ${Math.round(xOffset2)}
    ${Math.round(yOffset2)}
  `;

  return (
    <svg className={styles.trackCanvas} viewBox="0 0 1024 768">
      <g transform={`scale(${1 * (zoomLevel / 10)})`}>
        <path d={svgPath} stroke="red" fill="transparent" />
      </g>
    </svg>
  );
};
