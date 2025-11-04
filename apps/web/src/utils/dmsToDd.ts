import type { DMS } from 'socket/types';

export const dmsToDd = (dms: DMS): number => {
  const { degrees, minutes, seconds = 0 } = dms;
  return degrees + minutes / 60 + seconds / 3600;
};
