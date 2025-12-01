import { describe, expect, it } from 'vitest';
import { bearingFromHeading, rotationDelta } from '../bearingFromHeading';

describe('rotationDelta', () => {
  it('should return 0 when headings are the same', () => {
    expect(rotationDelta(90, 90)).toBe(0);
    expect(rotationDelta(0, 0)).toBe(0);
    expect(rotationDelta(360, 0)).toBe(0);
  });

  it('should return positive delta for clockwise rotation', () => {
    expect(rotationDelta(0, 90)).toBe(90);
    expect(rotationDelta(90, 180)).toBe(90);
    expect(rotationDelta(270, 360)).toBe(90);
  });

  it('should return negative delta for counter-clockwise rotation', () => {
    expect(rotationDelta(90, 0)).toBe(-90);
    expect(rotationDelta(180, 90)).toBe(-90);
    expect(rotationDelta(360, 270)).toBe(-90);
  });

  it('should handle wraparound cases correctly', () => {
    expect(rotationDelta(350, 10)).toBe(20);
    expect(rotationDelta(10, 350)).toBe(-20);
    expect(rotationDelta(0, 270)).toBe(-90);
    expect(rotationDelta(270, 0)).toBe(90);
  });

  it('should return shortest path (within -180 to 180)', () => {
    expect(rotationDelta(0, 270)).toBe(-90);
    expect(rotationDelta(270, 0)).toBe(90);
    expect(rotationDelta(10, 350)).toBe(-20);
    expect(rotationDelta(350, 10)).toBe(20);
  });

  it('should handle negative headings', () => {
    expect(rotationDelta(-90, 90)).toBe(-180);
    expect(rotationDelta(90, -90)).toBe(-180);
    expect(rotationDelta(-45, 45)).toBe(90);
  });

  it('should handle headings greater than 360', () => {
    expect(rotationDelta(450, 90)).toBe(0);
    expect(rotationDelta(90, 450)).toBe(0);
    expect(rotationDelta(450, 180)).toBe(90);
  });
});

describe('bearingFromHeading', () => {
  it('should return new heading when rotation delta is applied', () => {
    expect(bearingFromHeading(0, 90)).toBe(90);
    expect(bearingFromHeading(90, 180)).toBe(180);
    expect(bearingFromHeading(270, 0)).toBe(360);
  });

  it('should handle wraparound cases', () => {
    expect(bearingFromHeading(350, 10)).toBe(370);
    expect(bearingFromHeading(10, 350)).toBe(-10);
    expect(bearingFromHeading(450, 250)).toBe(610);
  });

  it('should handle edge cases', () => {
    expect(bearingFromHeading(0, 0)).toBe(0);
    expect(bearingFromHeading(360, 0)).toBe(360);
    expect(bearingFromHeading(-90, 90)).toBe(-270);
  });
});
