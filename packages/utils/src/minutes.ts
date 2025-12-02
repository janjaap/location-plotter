import { MINUTES_PER_HOUR, SECONDS_PER_MINUTE } from './constants';
import { ddToDms } from './ddToDms';
import { dmsToDd } from './dmsToDd';

/**
 * Rounds decimal degrees to the closest minute.
 * If seconds are 30 or more, rounds up the minutes.
 * If an offset is provided, adds it to the minutes after rounding.
 * Seconds are set to zero in the result.
 */
export const closestMinute = (decimalDegrees: number, offset?: number) => {
  const dms = ddToDms(decimalDegrees);
  const result = { ...dms };

  if (dms.seconds === 0) {
    return decimalDegrees;
  }

  if (result.seconds >= SECONDS_PER_MINUTE / 2) {
    result.minutes += 1;

    if (result.minutes === MINUTES_PER_HOUR) {
      result.minutes = 0;
      result.degrees += 1;
    }
  }

  if (offset) {
    result.minutes += offset;
  }

  result.seconds = 0;

  return dmsToDd(result);
};

export const diffInSeconds = (from: number, to: number) => (from - to) * 3600;
