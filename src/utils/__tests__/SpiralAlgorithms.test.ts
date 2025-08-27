import { describe, it, expect } from 'vitest';
import {
  ArchimedeanSpiral,
  LogarithmicSpiral,
  GalaxySpiral,
  FermatsSpiral,
  polarToCartesian,
  applySpacingGrowth,
  type SpiralConfig
} from '../SpiralAlgorithms';

const defaultConfig: SpiralConfig = {
  spiralTightness: 1.0,
  nodeSpacing: 30,
  spacingGrowth: 'linear'
};

describe('SpiralAlgorithms', () => {
  describe('ArchimedeanSpiral', () => {
    it('should generate increasing radius values', () => {
      const spiral = new ArchimedeanSpiral(defaultConfig);
      
      const point1 = spiral.getPoint(1);
      const point2 = spiral.getPoint(2);
      const point3 = spiral.getPoint(3);
      
      expect(point2.r).toBeGreaterThan(point1.r);
      expect(point3.r).toBeGreaterThan(point2.r);
    });

    it('should have consistent theta progression', () => {
      const spiral = new ArchimedeanSpiral(defaultConfig);
      
      const point1 = spiral.getPoint(1);
      const point2 = spiral.getPoint(2);
      
      expect(point2.theta).toBeGreaterThan(point1.theta);
    });
  });

  describe('LogarithmicSpiral', () => {
    it('should generate exponentially increasing radius values', () => {
      const spiral = new LogarithmicSpiral(defaultConfig);
      
      const point1 = spiral.getPoint(1);
      const point2 = spiral.getPoint(2);
      const point3 = spiral.getPoint(3);
      
      expect(point2.r).toBeGreaterThan(point1.r);
      expect(point3.r).toBeGreaterThan(point2.r);
      
      // The growth should be more than linear
      const growth1to2 = point2.r - point1.r;
      const growth2to3 = point3.r - point2.r;
      expect(growth2to3).toBeGreaterThan(growth1to2);
    });
  });

  describe('GalaxySpiral', () => {
    it('should create multiple arms', () => {
      const spiral = new GalaxySpiral(defaultConfig, 3);
      
      expect(spiral.getArms()).toBe(3);
      
      // Test that different arms have different starting angles
      const arm0Point = spiral.getPoint(1, 0);
      const arm1Point = spiral.getPoint(1, 1);
      const arm2Point = spiral.getPoint(1, 2);
      
      expect(arm1Point.theta).not.toBe(arm0Point.theta);
      expect(arm2Point.theta).not.toBe(arm1Point.theta);
    });
  });

  describe('FermatsSpiral', () => {
    it('should generate points with square root radius growth', () => {
      const spiral = new FermatsSpiral(defaultConfig);
      
      const point1 = spiral.getPoint(1);
      const point4 = spiral.getPoint(4);
      const point9 = spiral.getPoint(9);
      
      // For Fermat's spiral, r = sqrt(a*t), so r should scale with sqrt(t)
      expect(point4.r / point1.r).toBeCloseTo(2, 1); // sqrt(4)/sqrt(1) = 2
      expect(point9.r / point1.r).toBeCloseTo(3, 1); // sqrt(9)/sqrt(1) = 3
    });
  });

  describe('polarToCartesian', () => {
    it('should convert polar coordinates correctly', () => {
      const point = { r: 10, theta: 0 }; // 10 units at 0 radians (rightward)
      const cartesian = polarToCartesian(point, 50, 50, 1);
      
      expect(cartesian.x).toBeCloseTo(60, 1); // 50 + 10*cos(0) = 60
      expect(cartesian.y).toBeCloseTo(50, 1); // 50 + 10*sin(0) = 50
    });

    it('should handle scaling correctly', () => {
      const point = { r: 10, theta: Math.PI / 2 }; // 10 units at 90 degrees (upward)
      const cartesian = polarToCartesian(point, 0, 0, 2); // 2x scale
      
      expect(cartesian.x).toBeCloseTo(0, 1); // 0 + 10*cos(π/2)*2 = 0
      expect(cartesian.y).toBeCloseTo(20, 1); // 0 + 10*sin(π/2)*2 = 20
    });
  });

  describe('applySpacingGrowth', () => {
    const maxRadius = 100;

    it('should not modify linear spacing', () => {
      const r = 50;
      const result = applySpacingGrowth(r, 'linear', maxRadius);
      expect(result).toBe(r);
    });

    it('should expand exponential spacing', () => {
      const r = 50;
      const result = applySpacingGrowth(r, 'exponential', maxRadius);
      expect(result).toBeGreaterThan(r);
    });

    it('should compress logarithmic spacing', () => {
      const r = 50;
      const result = applySpacingGrowth(r, 'logarithmic', maxRadius);
      expect(result).toBeLessThan(r);
    });
  });
});