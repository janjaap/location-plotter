
export function ddToDms(coordinate: number) {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60);

  return { degrees, minutes, seconds };
}

const zeroPad = (num: number, places = 3) =>
  String(num).padStart(places, '0');

export function ddToDmsFormatted(coordinate: number) {
  const { degrees, minutes, seconds } = ddToDms(coordinate);
  return `${zeroPad(degrees)}° ${minutes}' ${seconds.toFixed(2)}"`;
}

export function coordsToDmsFormatted(degrees: number, minutes: number, seconds?: number, decimalPlaces = 2) {
  return `${zeroPad(degrees)}° ${minutes}' ${seconds !== undefined && seconds >= 0 ? `${seconds.toFixed(decimalPlaces)}` : '0'}"`;
}
