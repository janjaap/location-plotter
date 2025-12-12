import { GeoPoint } from '@lib/GeoPoint';
import { ServerEvents, type Coordinate, type GridPoint } from '@milgnss/utils/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { clientSocket } from '../lib/clientSocket';
import { useParams } from '../providers/ParamsProvider/ParamsProvider';
import { usePosition } from './usePosition';

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
  const { offset, zoomLevel } = useParams();
  const { startPosition, ...positionData } = usePosition();

  const convertPositionToGridPoint = useCallback(
    (position: Coordinate): GridPoint => {
      if (!startPosition) return { x: 0, y: 0 };

      const { x, y } = new GeoPoint(position.lat, position.long)
        .offset(offset)
        .zoomLevel(zoomLevel)
        .toGridCoordinate({ reference: startPosition });

      return {
        x: x + viewBox.width / 2,
        y: y + viewBox.height / 2,
      };
    },
    [startPosition, offset, viewBox.height, viewBox.width, zoomLevel],
  );

  const gridStartPoint: GridPoint = useMemo(
    () =>
      startPosition ? convertPositionToGridPoint(startPosition) : { x: offset.x, y: offset.y },
    [startPosition, convertPositionToGridPoint, offset.x, offset.y],
  );

  const pointsList = useCallback(
    (asPath = false) =>
      coordinates.reduce(
        (acc, position) => {
          const { x, y } = convertPositionToGridPoint(position);

          if (!x && !y) return acc;

          return (acc += `${asPath ? 'L' : ' '}${x} ${y}`);
        },
        `${asPath ? 'M' : ''}${gridStartPoint.x} ${gridStartPoint.y}`,
      ),
    [coordinates, gridStartPoint.x, gridStartPoint.y, convertPositionToGridPoint],
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const { width, height } = svgRef.current.getBoundingClientRect();

    setViewBox({ width, height });
  }, [svgRef]);

  useEffect(() => {
    if (!positionData?.position) return;

    const { position } = positionData;

    setCoordinates((prev) => [...prev, position]);
  }, [positionData]);

  useEffect(() => {
    const reset = () => {
      setCoordinates([]);
    };

    clientSocket.on(ServerEvents.RESET, reset);

    return () => {
      clientSocket.off(ServerEvents.RESET, reset);
    };
  }, []);

  const points = pointsList();
  const path = pointsList(true);

  return { viewBox, points, path };
};
