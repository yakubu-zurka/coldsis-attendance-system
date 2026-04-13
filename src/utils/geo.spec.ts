import { describe, it, expect } from 'vitest';
import { calculateDistance, effectiveDistance } from './geo';

// Known points: Accra (approx) and nearby point
const accra = { lat: 5.6037, lng: -0.1870 };
const nearby = { lat: 5.6047, lng: -0.1860 };

describe('geo utilities', () => {
  it('calculates non-zero distance between nearby points', () => {
    const d = calculateDistance(accra.lat, accra.lng, nearby.lat, nearby.lng);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(2000); // should be under 2km
  });

  it('effectiveDistance reduces distance by accuracy and floors at 0', () => {
    const d = 100;
    expect(effectiveDistance(d, 10)).toBe(90);
    expect(effectiveDistance(50, 100)).toBe(0);
  });
});
