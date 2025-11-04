import { describe, expect, it } from 'vitest';
import { updatePosition } from '../updatePosition';

describe('updatePosition', () => {
  it('should return the same position when speed is 0', () => {
    const result = updatePosition(40.7128, -74.006, 0, 90, 3600);
    expect(result.lat).toBe(40.7128);
    expect(result.long).toBe(-74.006);
  });

  it('should return the same position when duration is 0', () => {
    const result = updatePosition(40.7128, -74.006, 10, 90, 0);
    expect(result.lat).toBe(40.7128);
    expect(result.long).toBe(-74.006);
  });

  it('should move east when heading is 90 degrees', () => {
    const result = updatePosition(0, 0, 1, 90, 3600);
    expect(result.lat).toBeCloseTo(0, 6);
    expect(result.long).toBeGreaterThan(0);
  });

  it('should move north when heading is 0 degrees', () => {
    const result = updatePosition(0, 0, 1, 0, 3600);
    expect(result.lat).toBeGreaterThan(0);
    expect(result.long).toBeCloseTo(0, 6);
  });

  it('should move west when heading is 270 degrees', () => {
    const result = updatePosition(0, 0, 1, 270, 3600);
    expect(result.lat).toBeCloseTo(0, 6);
    expect(result.long).toBeLessThan(0);
  });

  it('should move south when heading is 180 degrees', () => {
    const result = updatePosition(0, 0, 1, 180, 3600);
    expect(result.lat).toBeLessThan(0);
    expect(result.long).toBeCloseTo(0, 6);
  });

  it('should handle high speed movement correctly', () => {
    const result = updatePosition(40.7128, -74.006, 100, 45, 1800);
    expect(result.lat).not.toEqual(40.7128);
    expect(result.long).not.toEqual(-74.006);
  });

  it('should handle negative coordinates', () => {
    const result = updatePosition(-40.7128, 74.006, 10, 135, 3600);
    expect(result.lat).not.toEqual(-40.7128);
    expect(result.long).not.toEqual(74.006);
  });

  it('should return valid coordinates for long duration movement', () => {
    const result = updatePosition(50.0, 10.0, 20, 90, 7200);
    expect(result.lat).toBeGreaterThan(-90);
    expect(result.lat).toBeLessThan(90);
    expect(result.long).toBeGreaterThan(-180);
    expect(result.long).toBeLessThan(180);
  });
});
