import { useParams } from '@providers/ParamsProvider/ParamsProvider';
import { useEffect } from 'react';
import type { CanvasEntity } from '../types';

export const useOffset = (objectToApplyOffsetTo: CanvasEntity) => {
  const { offset } = useParams();

  useEffect(() => {
    if (!objectToApplyOffsetTo || !(offset.x && offset.y)) return;

    objectToApplyOffsetTo.offset = offset;
  }, [objectToApplyOffsetTo, offset]);
};
