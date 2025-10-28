import type { DMS } from '../types';

export function ddToDms(decimalDegrees: number) {
  const absolute = Math.abs(decimalDegrees);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = (minutesNotTruncated - minutes) * 60;

  return { degrees, minutes, seconds };
}

const zeroPad = (num: number, places = 3) => String(num).padStart(places, '0');

export function ddToDmsFormatted(decimalDegrees: number) {
  const { degrees, minutes, seconds } = ddToDms(decimalDegrees);
  return `${zeroPad(degrees)}° ${minutes}' ${seconds.toFixed(2)}"`;
}

export function coordsToDmsFormatted(dms: DMS, decimalPlaces = 2) {
  const { degrees, minutes, seconds } = dms;
  return `${zeroPad(degrees)}° ${minutes}' ${seconds !== undefined && seconds >= 0 ? `${seconds.toFixed(decimalPlaces)}` : '0'}"`;
}
