import { useParams } from '@providers/ParamsProvider/ParamsProvider';
import { useEffect } from 'react';
import type { CanvasEntity } from '../types';

export const useZoomLevel = (objectToApplyZoomTo: CanvasEntity) => {
  const { zoomLevel } = useParams();

  useEffect(() => {
    if (!objectToApplyZoomTo) return;

    objectToApplyZoomTo.zoomLevel = zoomLevel;
  }, [objectToApplyZoomTo, zoomLevel]);
};
