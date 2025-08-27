import type { AugmentedIndividual } from '../components/types';
import {
  ArchimedeanSpiral,
  LogarithmicSpiral,
  GalaxySpiral,
  FermatsSpiral,
  SpiralConfig,
  polarToCartesian,
  applySpacingGrowth
} from './SpiralAlgorithms';

export type SpiralType = 'archimedean' | 'logarithmic' | 'galaxy' | 'fermat';
export type LayoutMode = 'primary-center' | 'oldest-center' | 'youngest-center';

export interface SpiralLayoutConfig extends SpiralConfig {
  spiralType: SpiralType;
  layoutMode: LayoutMode;
  primaryIndividualId?: string; // Required for primary-center mode
  centerX: number;
  centerY: number;
  maxRadius: number;
}

export interface IndividualPosition {
  id: string;
  x: number;
  y: number;
  distance: number; // Distance from center individual
  spiralIndex: number; // Position along the spiral
}

/**
 * Spiral Layout Transformer
 * Positions family tree individuals along various mathematical spiral curves
 */
export class SpiralLayoutTransformer {
  private config: SpiralLayoutConfig;
  private spiral: ArchimedeanSpiral | LogarithmicSpiral | GalaxySpiral | FermatsSpiral;

  constructor(config: SpiralLayoutConfig) {
    this.config = config;
    this.spiral = this.createSpiral(config);
  }

  private createSpiral(config: SpiralLayoutConfig) {
    switch (config.spiralType) {
      case 'archimedean':
        return new ArchimedeanSpiral(config);
      case 'logarithmic':
        return new LogarithmicSpiral(config);
      case 'galaxy':
        return new GalaxySpiral(config);
      case 'fermat':
        return new FermatsSpiral(config);
      default:
        return new ArchimedeanSpiral(config);
    }
  }

  /**
   * Transform family data into spiral layout positions
   */
  public transform(individuals: AugmentedIndividual[]): IndividualPosition[] {
    if (individuals.length === 0) return [];

    // Determine center individual based on layout mode
    const centerIndividual = this.getCenterIndividual(individuals);
    
    // Build family tree structure and calculate distances
    const familyTree = this.buildFamilyTree(individuals, centerIndividual.id);
    
    // Sort individuals by distance from center for spiral positioning
    const sortedIndividuals = this.sortByDistance(familyTree);
    
    // Position individuals along the spiral
    return this.positionAlongSpiral(sortedIndividuals);
  }

  /**
   * Determine the center individual based on layout mode
   */
  private getCenterIndividual(individuals: AugmentedIndividual[]): AugmentedIndividual {
    switch (this.config.layoutMode) {
      case 'primary-center':
        if (!this.config.primaryIndividualId) {
          throw new Error('Primary individual ID is required for primary-center mode');
        }
        const primaryInd = individuals.find(ind => ind.id === this.config.primaryIndividualId);
        if (!primaryInd) {
          throw new Error(`Primary individual with ID ${this.config.primaryIndividualId} not found`);
        }
        return primaryInd;
        
      case 'oldest-center':
        // Find individual with the highest (most positive) generation value
        return individuals.reduce((oldest, current) => {
          const oldestGen = oldest.generation ?? 0;
          const currentGen = current.generation ?? 0;
          return currentGen > oldestGen ? current : oldest;
        });
        
      case 'youngest-center':
        // Find individual with the lowest (most negative) generation value
        return individuals.reduce((youngest, current) => {
          const youngestGen = youngest.generation ?? 0;
          const currentGen = current.generation ?? 0;
          return currentGen < youngestGen ? current : youngest;
        });
        
      default:
        // Default to first individual
        return individuals[0];
    }
  }

  /**
   * Build family tree structure with distances from center
   */
  private buildFamilyTree(
    individuals: AugmentedIndividual[],
    centerId: string
  ): Map<string, { individual: AugmentedIndividual; distance: number }> {
    const individualsMap = new Map<string, AugmentedIndividual>();
    individuals.forEach(ind => individualsMap.set(ind.id, ind));

    const familyTree = new Map<string, { individual: AugmentedIndividual; distance: number }>();
    const visited = new Set<string>();
    const queue: { id: string; distance: number }[] = [{ id: centerId, distance: 0 }];

    while (queue.length > 0) {
      const { id, distance } = queue.shift()!;
      
      if (visited.has(id)) continue;
      visited.add(id);

      const individual = individualsMap.get(id);
      if (!individual) continue;

      familyTree.set(id, { individual, distance });

      // Add connected individuals to queue
      const connections = [
        ...individual.parents,
        ...individual.children,
        ...individual.spouses,
        ...individual.siblings
      ];

      connections.forEach(connId => {
        if (!visited.has(connId) && individualsMap.has(connId)) {
          queue.push({ id: connId, distance: distance + 1 });
        }
      });
    }

    // Add any remaining individuals that weren't connected
    individuals.forEach(ind => {
      if (!familyTree.has(ind.id)) {
        familyTree.set(ind.id, { individual: ind, distance: individuals.length });
      }
    });

    return familyTree;
  }

  /**
   * Sort individuals by their distance from center, with some randomization for same-distance individuals
   */
  private sortByDistance(
    familyTree: Map<string, { individual: AugmentedIndividual; distance: number }>
  ): Array<{ individual: AugmentedIndividual; distance: number }> {
    const entries = Array.from(familyTree.values());
    
    return entries.sort((a, b) => {
      // Primary sort by distance
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      
      // Secondary sort by ID for consistency within same distance
      return a.individual.id.localeCompare(b.individual.id);
    });
  }

  /**
   * Position individuals along the spiral curve
   */
  private positionAlongSpiral(
    sortedIndividuals: Array<{ individual: AugmentedIndividual; distance: number }>
  ): IndividualPosition[] {
    const positions: IndividualPosition[] = [];
    
    for (let i = 0; i < sortedIndividuals.length; i++) {
      const { individual, distance } = sortedIndividuals[i];
      
      // Handle center individual (first in sorted list)
      if (i === 0) {
        positions.push({
          id: individual.id,
          x: this.config.centerX,
          y: this.config.centerY,
          distance: 0,
          spiralIndex: 0
        });
        continue;
      }

      // Calculate spiral position
      let spiralPoint;
      
      if (this.spiral instanceof GalaxySpiral) {
        // For galaxy spiral, distribute individuals across multiple arms
        const armIndex = i % this.spiral.getArms();
        spiralPoint = this.spiral.getPoint(i, armIndex);
      } else {
        spiralPoint = this.spiral.getPoint(i);
      }

      // Apply spacing growth algorithm
      const adjustedR = applySpacingGrowth(
        spiralPoint.r,
        this.config.spacingGrowth,
        this.config.maxRadius
      );

      // Convert to cartesian coordinates
      const scale = Math.min(1, this.config.maxRadius / (adjustedR || 1));
      const { x, y } = polarToCartesian(
        { r: adjustedR, theta: spiralPoint.theta },
        this.config.centerX,
        this.config.centerY,
        scale
      );

      positions.push({
        id: individual.id,
        x,
        y,
        distance,
        spiralIndex: i
      });
    }

    return positions;
  }

  /**
   * Update configuration and recreate spiral
   */
  public updateConfig(newConfig: Partial<SpiralLayoutConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.spiral = this.createSpiral(this.config);
  }

  /**
   * Get the current configuration
   */
  public getConfig(): SpiralLayoutConfig {
    return { ...this.config };
  }
}