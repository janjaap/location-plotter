import type { DMS } from 'socket/types';

const zeroPad = (num: number, places = 3) => String(num).padStart(places, '0');

const normalizeValues = ({ degrees, minutes, seconds }: DMS): DMS => {
  if (seconds >= 60 || seconds < 0.0001 || Math.abs(seconds - 60) < 0.0001) {
    seconds = 0;
    minutes += 1;
  }

  if (minutes >= 60) {
    minutes = 0;
    degrees += 1;
  }

  return { degrees, minutes, seconds };
};

const toDmsFormatted = (dms: DMS, decimalPlaces = 2) => {
  const { degrees, minutes, seconds } = dms;

  return `${zeroPad(degrees)}° ${minutes}' ${seconds === 0 ? '0' : seconds.toFixed(decimalPlaces)}"`;
};

export const ddToDms = (decimalDegrees: number) => {
  const absolute = Math.abs(decimalDegrees);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = (minutesNotTruncated - minutes) * 60;

  return normalizeValues({ degrees, minutes, seconds });
};

export const ddToDmsFormatted = (decimalDegrees: number, decimalPlaces?: number) =>
  toDmsFormatted(normalizeValues(ddToDms(decimalDegrees)), decimalPlaces);

export const coordsToDmsFormatted = (dms: DMS, decimalPlaces?: number) =>
  toDmsFormatted(normalizeValues(dms), decimalPlaces);
