import { describe, expect, it } from 'vitest';
import { dmsToDd } from '../dmsToDd';

describe('dmsToDd', () => {
  it('should convert DMS to decimal degrees with all components', () => {
    const dms = { degrees: 40, minutes: 30, seconds: 30 };
    const result = dmsToDd(dms);
    expect(result).toBeCloseTo(40.50833333, 7);
  });

  it('should handle zero values', () => {
    const dms = { degrees: 0, minutes: 0, seconds: 0 };
    const result = dmsToDd(dms);
    expect(result).toBe(0);
  });

  it('should handle fractional seconds', () => {
    const dms = { degrees: 12, minutes: 34, seconds: 56.789 };
    const result = dmsToDd(dms);
    expect(result).toBeCloseTo(12.58244138, 7);
  });

  it('should handle negative degrees', () => {
    const dms = { degrees: -23, minutes: 30, seconds: 45 };
    const result = dmsToDd(dms);
    expect(result).toBeCloseTo(-22.4875, 7);
  });
});
