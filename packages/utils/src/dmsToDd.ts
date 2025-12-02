import { SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from './constants';
import { DMS } from './types';

export const dmsToDd = (dms: DMS) => {
  const { degrees, minutes, seconds = 0 } = dms;
  return degrees + minutes / SECONDS_PER_MINUTE + seconds / SECONDS_PER_HOUR;
};
