import { useCallback, useEffect, useRef, useState } from 'react';

const evCache: PointerEvent[] = [];

export const usePinchZoom = (targetElement: HTMLElement | null) => {
  const prevDiff = useRef<number>(-1);
  const [zoom, setZoom] = useState<'in' | 'out' | null>(null);

  const removeEvent = useCallback((ev: PointerEvent) => {
    // Remove this event from the target's cache
    const index = evCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId);
    evCache.splice(index, 1);
  }, []);

  const onPointerDown = useCallback((event: PointerEvent) => {
    console.log('Pointer down', event);
    evCache.push(event);

    // if (event.pointerType === 'touch') {
    //   targetElement.setPointerCapture(event.pointerId);
    // }
  }, []);

  const onPointerMove = useCallback((event: PointerEvent) => {
    const index = evCache.findIndex((cachedEv) => cachedEv.pointerId === event.pointerId);
    evCache[index] = event;

    if (evCache.length < 2) return;

    // Calculate the distance between the two pointers
    const curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);

    if (prevDiff.current > 0) {
      if (curDiff > prevDiff.current) {
        // The distance between the two pointers has increased
        console.log('Pinch moving OUT -> Zoom in', event);

        setZoom('in');
      }

      if (curDiff < prevDiff.current) {
        // The distance between the two pointers has decreased
        console.log('Pinch moving IN -> Zoom out', event);

        setZoom('out');
      }
    }

    prevDiff.current = curDiff;
  }, []);

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      // if (event.pointerType === 'touch') {
      //   targetElement.releasePointerCapture(event.pointerId);
      // }
      removeEvent(event);

      if (evCache.length < 2) {
        // We only have one pointer left
        prevDiff.current = -1;
      }
    },
    [removeEvent],
  );

  useEffect(() => {
    if (!targetElement) return;

    targetElement.addEventListener('pointercancel', onPointerUp);
    targetElement.addEventListener('pointerdown', onPointerDown);
    targetElement.addEventListener('pointerleave', onPointerUp);
    targetElement.addEventListener('pointermove', onPointerMove);
    targetElement.addEventListener('pointerout', onPointerUp);
    targetElement.addEventListener('pointerup', onPointerUp);

    return () => {
      targetElement.removeEventListener('pointercancel', onPointerUp);
      targetElement.removeEventListener('pointerdown', onPointerDown);
      targetElement.removeEventListener('pointerleave', onPointerUp);
      targetElement.removeEventListener('pointermove', onPointerMove);
      targetElement.removeEventListener('pointerout', onPointerUp);
      targetElement.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerDown, onPointerMove, onPointerUp, targetElement]);

  return { zoom };
};
