/**
 * Mathematical spiral algorithms for positioning family tree individuals
 * Each algorithm returns polar coordinates (r, theta) that can be converted to cartesian (x, y)
 */

export interface SpiralPoint {
  r: number;    // radius from center
  theta: number; // angle in radians
}

export interface SpiralConfig {
  spiralTightness: number;  // Controls distance between spiral rings (0.1-2.0)
  nodeSpacing: number;      // Distance between nodes along curve (10-100px)
  spacingGrowth: 'linear' | 'exponential' | 'logarithmic'; // How spacing changes with distance
}

/**
 * Archimedean Spiral: r = a + b * θ
 * Uniform spacing spiral where radius increases linearly with angle
 */
export class ArchimedeanSpiral {
  private a: number; // starting radius
  private b: number; // how fast radius grows with angle

  constructor(config: SpiralConfig) {
    this.a = config.nodeSpacing * 0.5; // Start close to center
    this.b = config.spiralTightness * config.nodeSpacing / (2 * Math.PI); // Controls spacing between rings
  }

  getPoint(t: number): SpiralPoint {
    const theta = t * 0.5; // Scale down for smoother curves
    const r = this.a + this.b * theta;
    return { r, theta };
  }
}

/**
 * Logarithmic Spiral: r = a * e^(b*θ)
 * Exponential growth spiral, also known as equiangular spiral
 */
export class LogarithmicSpiral {
  private a: number; // scale factor
  private b: number; // growth rate

  constructor(config: SpiralConfig) {
    this.a = config.nodeSpacing * 0.5; // Starting radius
    this.b = config.spiralTightness * 0.2; // Growth rate (smaller values for tighter spirals)
  }

  getPoint(t: number): SpiralPoint {
    const theta = t * 0.3; // Scale for appropriate growth
    const r = this.a * Math.exp(this.b * theta);
    return { r, theta };
  }
}

/**
 * Galaxy Spiral: Multi-arm spiral resembling a galaxy's disk perspective
 * Creates multiple spiral arms emanating from the center
 */
export class GalaxySpiral {
  private arms: number;
  private a: number;
  private b: number;
  private armSeparation: number;

  constructor(config: SpiralConfig, arms: number = 3) {
    this.arms = arms;
    this.a = config.nodeSpacing * 0.3;
    this.b = config.spiralTightness * 0.15;
    this.armSeparation = (2 * Math.PI) / arms;
  }

  getPoint(t: number, armIndex: number = 0): SpiralPoint {
    const theta = t * 0.4 + (armIndex * this.armSeparation);
    const r = this.a * Math.exp(this.b * t * 0.4);
    return { r, theta };
  }

  getArms(): number {
    return this.arms;
  }
}

/**
 * Fermat's Spiral: r = ±√(a*θ)
 * Optimal packing spiral, also known as parabolic spiral
 * Good for dense, efficient packing of nodes
 */
export class FermatsSpiral {
  private a: number; // scale factor
  private goldenAngle: number = 2.39996323; // Golden angle in radians

  constructor(config: SpiralConfig) {
    this.a = config.spiralTightness * config.nodeSpacing * 0.8;
  }

  getPoint(t: number): SpiralPoint {
    const theta = t * this.goldenAngle; // Use golden angle for optimal packing
    const r = Math.sqrt(this.a * Math.abs(t));
    return { r, theta };
  }
}

/**
 * Utility function to convert polar coordinates to cartesian
 */
export function polarToCartesian(
  point: SpiralPoint,
  centerX: number,
  centerY: number,
  scale: number = 1
): { x: number; y: number } {
  const x = centerX + point.r * Math.cos(point.theta) * scale;
  const y = centerY + point.r * Math.sin(point.theta) * scale;
  return { x, y };
}

/**
 * Apply spacing growth algorithm to modify radius based on distance from center
 */
export function applySpacingGrowth(
  r: number,
  spacingGrowth: SpiralConfig['spacingGrowth'],
  maxRadius: number
): number {
  const normalizedR = r / maxRadius; // Normalize to 0-1 range
  
  switch (spacingGrowth) {
    case 'linear':
      return r; // No modification
    case 'exponential':
      return r * (1 + normalizedR); // Nodes spread out more towards edges
    case 'logarithmic':
      return r * (1 - normalizedR * 0.3); // Nodes pack more densely towards edges
    default:
      return r;
  }
}