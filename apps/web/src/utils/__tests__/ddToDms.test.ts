import { describe, expect, test } from 'vitest';
import { coordsToDmsFormatted, ddToDms, ddToDmsFormatted } from '../ddToDms';

describe('ddToDms', () => {
  test('converts decimal degrees to DMS correctly', () => {
    expect(ddToDms(0)).toEqual({ degrees: 0, minutes: 0, seconds: 0 });

    expect(ddToDms(45.7625)).toEqual({ degrees: 45, minutes: 45, seconds: expect.closeTo(45) });

    expect(ddToDms(-73.985656)).toEqual({
      degrees: 73,
      minutes: 59,
      seconds: expect.closeTo(8.3616),
    });

    expect(ddToDms(179.9999)).toEqual({
      degrees: 180,
      minutes: 0,
      seconds: 0,
    });

    expect(ddToDms(52.95138889)).toEqual({
      degrees: 52,
      minutes: 57,
      seconds: expect.closeTo(5.0),
    });
  });

  describe('ddToDmsFormatted', () => {
    test('formats DMS strings correctly', () => {
      expect(ddToDmsFormatted(0)).toEqual('000° 0\' 0"');

      expect(ddToDmsFormatted(52.95138889)).toEqual('052° 57\' 5.00"');
    });
  });

  describe('coordsToDmsFormatted', () => {
    test('formats DMS strings from DMS object correctly', () => {
      expect(coordsToDmsFormatted({ degrees: 73, minutes: 59, seconds: 8.3616 })).toEqual(
        '073° 59\' 8.36"',
      );

      expect(coordsToDmsFormatted({ degrees: 45, minutes: 45, seconds: 45 }, 0)).toEqual(
        '045° 45\' 45"',
      );
    });
  });
});
