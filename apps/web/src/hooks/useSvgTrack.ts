import {
  ServerEvents,
  type Coordinate,
  type GridPoint,
  type PositionPayload,
} from '@milgnss/utils/types';
import { useCallback, useEffect, useState } from 'react';
import { gridCoordinate } from '../../../../packages/utils/src/gridCoordinate';
import { Canvas } from '../lib/canvas';
import { clientSocket } from '../lib/clientSocket';
import { useParams } from '../providers/ParamsProvider/ParamsProvider';
import { useCenter } from './useCenter';

type ViewBox = {
  width: number;
  height: number;
};

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const useSvgTrack = ({ svgRef }: Props) => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [viewBox, setViewBox] = useState<ViewBox>({ width: 0, height: 0 });
  const { offset } = useParams();
  const center = useCenter();

  const convertPositionToGridPoint = useCallback(
    (position: Coordinate): GridPoint => {
      if (!center) return { x: 0, y: 0 };

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
    if (!svgRef.current) return;

    const { width, height } = svgRef.current.getBoundingClientRect();

    setViewBox({ width, height });
  }, [svgRef]);

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

  const points = pointsList();
  const path = pointsList(true);

  return { viewBox, points, path };
};
