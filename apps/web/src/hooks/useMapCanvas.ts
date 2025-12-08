import { type GridPoint } from '@milgnss/utils/types';
import { useRef, useState, type MouseEvent, type RefObject } from 'react';
import { Canvas } from '../lib/Canvas';
import { useParams } from '../providers/ParamsProvider/ParamsProvider';

interface Props {
  containerRef: RefObject<HTMLDivElement | null>;
}

export const useMapCanvas = ({ containerRef }: Props) => {
  const [dragStart, setDragStart] = useState<GridPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { updateOffset, offset } = useParams();
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

    const offsetX = baseOffsetRef.current.x + diffX;
    const offsetY = baseOffsetRef.current.y + diffY;

    if (!Canvas.validOffset({ x: offsetX, y: offsetY })) {
      return;
    }

    updateOffset({ x: offsetX, y: offsetY });
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  return { onDrag, onDragEnd, onDragStart };
};
