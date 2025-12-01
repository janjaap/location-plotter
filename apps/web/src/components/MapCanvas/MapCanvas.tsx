import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ServerEvents, type Coordinate, type PositionPayload } from 'socket/types';
// import { usePinchZoom } from '../../hooks/usePinchZoom';
import { clientSocket } from '../../lib/clientSocket';
import { useParams } from '../../providers/ParamsProvider/ParamsProvider';
import type { GridPoint } from '../../types';
import { Compass } from '../Compass/Compass';
import { Duration } from '../Duration/Duration';
import { Grid } from './Grid';
import styles from './MapCanvas.module.css';
import { Ship } from './Ship';
import { Track } from './Track';

export type CanvasProps = {
  center: Coordinate;
};

export const MapCanvas = () => {
  const [dragStart, setDragStart] = useState<GridPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [center, setCenter] = useState<Coordinate | null>(null);
  const { updateOffset, offset } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const baseOffsetRef = useRef<GridPoint>(offset);

  const mouseCoord = (event: MouseEvent) => {
    if (!containerRef.current) return;

    const centerX = containerRef.current.clientWidth / 2;
    const centerY = containerRef.current.clientHeight / 2;

    const containerLeft = containerRef.current.getClientRects()[0].left;
    const containerTop = containerRef.current.getClientRects()[0].top;

    const x = event.clientX - containerLeft - centerX;
    const y = event.clientY - containerTop - centerY;

    return { x, y };
  };

  const onDragStart = (event: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const coord = mouseCoord(event);

    if (!coord) return;

    setDragStart(coord);
    setIsDragging(true);
    baseOffsetRef.current = offset;
  };

  const onDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !dragStart || !isDragging) return;

    const coord = mouseCoord(event);

    if (!coord) return;

    const { x, y } = coord;

    const diffX = x - dragStart.x;
    const diffY = y - dragStart.y;

    if (diffX === 0 && diffY === 0) return;

    const offsetX = baseOffsetRef.current.x + diffX;
    const offsetY = baseOffsetRef.current.y + diffY;

    updateOffset({ x: offsetX, y: offsetY });
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const init = ({ position }: PositionPayload) => {
      setCenter(position);
    };

    clientSocket.on(ServerEvents.INIT, init);

    return () => {
      clientSocket.off(ServerEvents.INIT, init);
    };
  }, []);

  if (!center) return null;

  return (
    <div
      className={styles.canvasContainer}
      ref={containerRef}
    >
      <div
        onMouseDown={onDragStart}
        onMouseMove={onDrag}
        onMouseUp={onDragEnd}
      >
        <Compass />
        <Duration />
        <Grid center={center} />
        <Track center={center} />
        <Ship center={center} />
      </div>
    </div>
  );
};
