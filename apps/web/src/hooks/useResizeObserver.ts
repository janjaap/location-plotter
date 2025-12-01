import { useEffect, useRef, useState } from 'react';
import type { Dimensions } from '../types';

export const useResizeObserver = (canvas: HTMLCanvasElement | null, callback: () => void) => {
  const observer = useRef<ResizeObserver | null>(null);

  const [{ width, height }, setDimensions] = useState<Dimensions>({
    width: canvas?.clientWidth ?? 0,
    height: canvas?.clientHeight ?? 0,
  });

  useEffect(() => {
    if (observer.current || !canvas) return;

    observer.current = new ResizeObserver(() => {
      if (canvas.clientWidth === width && canvas.clientHeight === height) {
        return;
      }

      setDimensions({ width: canvas.clientWidth, height: canvas.clientHeight });
      callback();
    });

    observer.current.observe(canvas);

    return () => {
      observer.current?.disconnect();
    };
  }, [canvas, callback, width, height]);
};
