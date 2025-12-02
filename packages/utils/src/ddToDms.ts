import { MINUTES_PER_HOUR, SECONDS_PER_MINUTE } from './constants';
import { DMS } from './types';

const zeroPad = (num: number, places = 3) => String(num).padStart(places, '0');

const normalizeValues = ({ degrees, minutes, seconds }: DMS): DMS => {
  if (Math.round(seconds) >= SECONDS_PER_MINUTE) {
    seconds = 0;
    minutes += 1;
  }

  if (minutes >= MINUTES_PER_HOUR) {
    minutes = 0;
    degrees += 1;
  }

  if (seconds < 0.0001 || Math.abs(seconds - SECONDS_PER_MINUTE) < 0.0001) {
    seconds = 0;
  }

  return { degrees, minutes, seconds };
};

const toDmsFormatted = (dms: DMS, decimalPlaces = 2) => {
  const { degrees, minutes, seconds } = dms;

  return `${zeroPad(degrees)}° ${minutes}' ${seconds === 0 ? '0' : seconds.toFixed(decimalPlaces)}"`;
};

export const ddToDms = (decimalDegrees: number) => {
  const absolute = Math.abs(decimalDegrees);
  const degrees = Math.trunc(absolute);
  const minutesNotTruncated = (absolute - degrees) * SECONDS_PER_MINUTE;
  const minutes = Math.trunc(minutesNotTruncated);
  const seconds = (minutesNotTruncated - minutes) * SECONDS_PER_MINUTE;

  return normalizeValues({ degrees, minutes, seconds });
};

export const ddToDmsFormatted = (decimalDegrees: number, decimalPlaces?: number) =>
  toDmsFormatted(ddToDms(decimalDegrees), decimalPlaces);

export const coordsToDmsFormatted = (dms: DMS, decimalPlaces?: number) =>
  toDmsFormatted(dms, decimalPlaces);
