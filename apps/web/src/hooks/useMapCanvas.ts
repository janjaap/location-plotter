import { zoomLevelToFactor } from '@milgnss/utils';
import { type GridPoint } from '@milgnss/utils/types';
import { useRef, useState, type MouseEvent, type RefObject } from 'react';
import { Canvas } from '../lib/Canvas';
import { useParams } from '../providers/ParamsProvider/ParamsProvider';

interface Props {
  containerRef: RefObject<HTMLDivElement | null>;
}

export const useMapCanvas = ({ containerRef }: Props) => {
  const [isDragging, setIsDragging] = useState(false);
  const { updateOffset, offset, zoomLevel } = useParams();
  const baseOffsetRef = useRef<GridPoint>(offset);
  const dragStartRef = useRef<GridPoint | null>(null);

  const zoomFactor = zoomLevelToFactor(zoomLevel);

  const mouseCoord = (event: MouseEvent): GridPoint | undefined => {
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

    setIsDragging(true);
    dragStartRef.current = coord;
    baseOffsetRef.current = offset;
  };

  const onDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !dragStartRef.current || !isDragging) return;

    const coord = mouseCoord(event);

    if (!coord) return;

    // Calculate the difference adjusted for zoom
    const diffX = (coord.x - dragStartRef.current.x) / zoomFactor;
    const diffY = (coord.y - dragStartRef.current.y) / zoomFactor;

    const offsetX = baseOffsetRef.current.x + diffX;
    const offsetY = baseOffsetRef.current.y + diffY;

    const newOffset = { x: offsetX, y: offsetY };

    if (!Canvas.validOffset(newOffset)) {
      return;
    }

    updateOffset(newOffset);
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  return { onDrag, onDragEnd, onDragStart };
};
