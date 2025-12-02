import { dmsToDd } from '@milgnss/utils';
import { DMS } from '@milgnss/utils/types';
import { describe, expect, test } from 'vitest';
import { getDistance } from '../getDistance';

const coordLat: DMS = { degrees: 52, minutes: 57, seconds: 0 };
const coordLong: DMS = { degrees: 4, minutes: 47, seconds: 0 };

describe('getDistance', () => {
  describe('longitude', () => {
    test('at 0 degrees latitude', () => {
      const coord1 = {
        lat: dmsToDd({ ...coordLat, degrees: 0 }),
        long: dmsToDd(coordLong),
      };

      const coord2 = {
        lat: dmsToDd({ ...coordLat, degrees: 0 }),
        long: dmsToDd({ ...coordLong, minutes: coordLong.minutes + 1 }),
      };

      const distance = getDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(1851);
      expect(distance).toBeLessThan(1853);
    });

    test('at 52 degrees latitude', () => {
      const coord1 = {
        lat: dmsToDd(coordLat),
        long: dmsToDd(coordLong),
      };

      const coord2 = {
        lat: dmsToDd(coordLat),
        long: dmsToDd({ ...coordLong, minutes: coordLong.minutes + 1 }),
      };

      const distance = getDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(1115);
      expect(distance).toBeLessThan(1117);
    });

    test('at 90 degrees latitude', () => {
      const coord1 = {
        lat: dmsToDd({ ...coordLat, degrees: 90 }),
        long: dmsToDd(coordLong),
      };

      const coord2 = {
        lat: dmsToDd({ ...coordLat, degrees: 90 }),
        long: dmsToDd({ ...coordLong, minutes: coordLong.minutes + 1 }),
      };

      const distance = getDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(28);
      expect(distance).toBeLessThan(32);
    });
  });

  describe('latitude', () => {
    test('at 0 degrees longitude', () => {
      const coord1 = {
        lat: dmsToDd(coordLat),
        long: dmsToDd({ ...coordLong, degrees: 0 }),
      };

      const coord2 = {
        lat: dmsToDd({ ...coordLat, minutes: coordLat.minutes + 1 }),
        long: dmsToDd({ ...coordLong, degrees: 0 }),
      };

      const distance = getDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(1852);
      expect(distance).toBeLessThan(1854);
    });

    test('at 90 degrees longitude', () => {
      const coord1 = {
        lat: dmsToDd(coordLat),
        long: dmsToDd({ ...coordLong, degrees: 90 }),
      };

      const coord2 = {
        lat: dmsToDd({ ...coordLat, minutes: coordLat.minutes + 1 }),
        long: dmsToDd({ ...coordLong, degrees: 90 }),
      };

      const distance = getDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(1852);
      expect(distance).toBeLessThan(1854);
    });

    test('at 180 degrees longitude', () => {
      const coord1 = {
        lat: dmsToDd(coordLat),
        long: dmsToDd({ ...coordLong, degrees: 180 }),
      };

      const coord2 = {
        lat: dmsToDd({ ...coordLat, minutes: coordLat.minutes + 1 }),
        long: dmsToDd({ ...coordLong, degrees: 180 }),
      };

      const distance = getDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(1852);
      expect(distance).toBeLessThan(1854);
    });
  });
});
