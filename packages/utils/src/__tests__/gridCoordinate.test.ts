import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ddToDms } from '../ddToDms';
import { gridCoordinate } from '../gridCoordinate';

vi.mock('../ddToDms', { spy: true });
const mockDdToDms = vi.mocked(ddToDms);

describe('gridCoordinate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate grid coordinates correctly', () => {
    mockDdToDms
      .mockReturnValueOnce({ degrees: 40, minutes: 30, seconds: 15 }) // position.lat
      .mockReturnValueOnce({ degrees: -74, minutes: 0, seconds: 30 }) // position.long
      .mockReturnValueOnce({ degrees: 40, minutes: 30, seconds: 0 }) // reference.lat
      .mockReturnValueOnce({ degrees: -74, minutes: 0, seconds: 0 }); // reference.long

    const gridPosition = gridCoordinate({
      position: { lat: 40.50416667, long: -74.00833333 },
      reference: { lat: 40.5, long: -74 },
    });

    expect(gridPosition).toEqual({ x: 450, y: -195 });
    expect(ddToDms).toHaveBeenCalledTimes(4);
  });

  it('should handle zero differences', () => {
    mockDdToDms.mockReturnValue({ degrees: 40, minutes: 30, seconds: 0 });

    const result = gridCoordinate({
      position: { lat: 40.5, long: -74 },
      reference: { lat: 40.5, long: -74 },
    });

    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('should handle negative coordinates', () => {
    mockDdToDms
      .mockReturnValueOnce({ degrees: -10, minutes: 15, seconds: 30 })
      .mockReturnValueOnce({ degrees: 20, minutes: 45, seconds: 15 })
      .mockReturnValueOnce({ degrees: -10, minutes: 0, seconds: 0 })
      .mockReturnValueOnce({ degrees: 20, minutes: 0, seconds: 0 });

    const result = gridCoordinate({
      position: { lat: -10.258333, long: 20.754167 },
      reference: { lat: -10, long: 20 },
    });

    expect(result).toEqual({ x: 40725, y: -12090 });
  });

  it('should round pixel values correctly', () => {
    mockDdToDms
      .mockReturnValueOnce({ degrees: 40, minutes: 30, seconds: 10.7 })
      .mockReturnValueOnce({ degrees: -74, minutes: 0, seconds: 20.3 })
      .mockReturnValueOnce({ degrees: 40, minutes: 30, seconds: 0 })
      .mockReturnValueOnce({ degrees: -74, minutes: 0, seconds: 0 });

    const result = gridCoordinate({
      position: { lat: 40.502972, long: -74.005639 },
      reference: { lat: 40.5, long: -74 },
    });

    expect(result).toEqual({ x: 305, y: -139 });
  });

  it('should work with different pixel ratios', () => {
    mockDdToDms
      .mockReturnValueOnce({ degrees: 40, minutes: 31, seconds: 0 })
      .mockReturnValueOnce({ degrees: -74, minutes: 1, seconds: 0 })
      .mockReturnValueOnce({ degrees: 40, minutes: 30, seconds: 0 })
      .mockReturnValueOnce({ degrees: -74, minutes: 0, seconds: 0 });

    const result = gridCoordinate({
      position: { lat: 40.516667, long: -74.016667 },
      reference: { lat: 40.5, long: -74 },
    });

    expect(result).toEqual({ x: 900, y: -780 });
  });
});
