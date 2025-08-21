/**
 * Supershape Generator Test
 */

import { describe, expect, it } from 'vitest';
import { supershapeGenerator } from './supershape';
import type { ShapeProfile } from '../../../../shared/types';

describe('supershapeGenerator', () => {
  it('should generate triangle geometry', () => {
    const profile: ShapeProfile = {
      kind: 'supershape',
      size: { width: 40, height: 40 },
      params: { m: 3, n1: 0.2, n2: 1.7, n3: 1.7, a: 1, b: 1 },
      detail: { maxVertices: 48 },
    };

    const geometry = supershapeGenerator(profile);

    expect(geometry.polygon).toBeDefined();
    expect(geometry.bounds).toBeDefined();
    expect(geometry.polygon.length).toBeGreaterThan(0);
    expect(geometry.polygon.length % 2).toBe(0); // Should be pairs of x,y coordinates

    console.log('Triangle geometry:', {
      pointCount: geometry.polygon.length / 2,
      bounds: geometry.bounds,
      firstFewPoints: Array.from(geometry.polygon.slice(0, 12)),
    });
  });

  it('should generate star geometry', () => {
    const profile: ShapeProfile = {
      kind: 'supershape',
      size: { width: 40, height: 40 },
      params: { m: 5, n1: 0.1, n2: 0.6, n3: 0.6, a: 1, b: 1 },
      detail: { maxVertices: 48 },
    };

    const geometry = supershapeGenerator(profile);

    expect(geometry.polygon).toBeDefined();
    expect(geometry.bounds).toBeDefined();
    expect(geometry.polygon.length).toBeGreaterThan(0);

    console.log('Star geometry:', {
      pointCount: geometry.polygon.length / 2,
      bounds: geometry.bounds,
      firstFewPoints: Array.from(geometry.polygon.slice(0, 12)),
    });
  });

  it('should generate square geometry', () => {
    const profile: ShapeProfile = {
      kind: 'supershape',
      size: { width: 40, height: 40 },
      params: { m: 4, n1: 0.2, n2: 1.0, n3: 1.0, a: 1, b: 1 },
      detail: { maxVertices: 48 },
    };

    const geometry = supershapeGenerator(profile);

    expect(geometry.polygon).toBeDefined();
    expect(geometry.bounds).toBeDefined();
    expect(geometry.polygon.length).toBeGreaterThan(0);

    console.log('Square geometry:', {
      pointCount: geometry.polygon.length / 2,
      bounds: geometry.bounds,
      firstFewPoints: Array.from(geometry.polygon.slice(0, 12)),
    });
  });

  it('should handle parameters correctly', () => {
    const profile: ShapeProfile = {
      kind: 'supershape',
      size: { width: 20, height: 30 },
      params: { m: 6, n1: 0.2, n2: 1.7, n3: 1.7, a: 1, b: 1 },
      detail: { maxVertices: 60 },
    };

    const geometry = supershapeGenerator(profile);

    // Bounds should match the requested size
    expect(geometry.bounds.w).toBe(20);
    expect(geometry.bounds.h).toBe(30);
    expect(geometry.bounds.x).toBe(-10); // -width/2
    expect(geometry.bounds.y).toBe(-15); // -height/2
  });

  it('should produce different geometries for different parameters', () => {
    const triangleProfile: ShapeProfile = {
      kind: 'supershape',
      size: { width: 40, height: 40 },
      params: { m: 3, n1: 0.2, n2: 1.7, n3: 1.7, a: 1, b: 1 },
      detail: { maxVertices: 24 },
    };

    const starProfile: ShapeProfile = {
      kind: 'supershape',
      size: { width: 40, height: 40 },
      params: { m: 5, n1: 0.1, n2: 0.6, n3: 0.6, a: 1, b: 1 },
      detail: { maxVertices: 24 },
    };

    const triangleGeometry = supershapeGenerator(triangleProfile);
    const starGeometry = supershapeGenerator(starProfile);

    // The geometries should be different
    expect(triangleGeometry.polygon).not.toEqual(starGeometry.polygon);

    // Log for visual inspection
    console.log('Triangle vs Star comparison:', {
      triangle: Array.from(triangleGeometry.polygon.slice(0, 8)),
      star: Array.from(starGeometry.polygon.slice(0, 8)),
    });
  });
});
