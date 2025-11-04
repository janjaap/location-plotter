import type { DMS } from 'socket/types';

export function ddToDms(decimalDegrees: number): DMS {
  const absolute = Math.abs(decimalDegrees);
  let degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  let minutes = Math.floor(minutesNotTruncated);
  let seconds = (minutesNotTruncated - minutes) * 60;

  if (Math.abs(60 - seconds) < 0.0001) {
    seconds = 0;
    minutes += 1;

    if (minutes === 60) {
      minutes = 0;
      degrees += 1;
    }
  }

  return { degrees, minutes, seconds };
}

const zeroPad = (num: number, places = 3) => String(num).padStart(places, '0');

export function ddToDmsFormatted(decimalDegrees: number, decimalPlaces = 2) {
  const dms = ddToDms(decimalDegrees);

  const result = { ...dms };

  if (Math.abs(60 - result.seconds) < 0.0001) {
    result.seconds = 0;
    result.minutes += 1;

    if (result.minutes === 60) {
      result.minutes = 0;
      result.degrees += 1;
    }
  }

  return `${zeroPad(result.degrees)}° ${result.minutes}' ${result.seconds.toFixed(decimalPlaces)}"`;
}

export function coordsToDmsFormatted(dms: DMS, decimalPlaces = 2) {
  const { degrees, minutes, seconds } = dms;
  return `${zeroPad(degrees)}° ${minutes}' ${seconds !== undefined && seconds >= 0 ? `${seconds.toFixed(decimalPlaces)}` : '0'}"`;
}
