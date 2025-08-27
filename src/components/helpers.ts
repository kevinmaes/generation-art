import type { AugmentedIndividual } from './types';
import { SpiralLayoutTransformer, type SpiralLayoutConfig, type IndividualPosition } from '../utils/SpiralLayoutTransformer';

// Global position cache to maintain consistency across render calls
let positionCache: Map<string, IndividualPosition> = new Map();
let lastFamilyDataHash: string = '';
let spiralTransformer: SpiralLayoutTransformer | null = null;

// Default spiral configuration
const DEFAULT_SPIRAL_CONFIG: SpiralLayoutConfig = {
  spiralType: 'archimedean',
  layoutMode: 'primary-center',
  spiralTightness: 1.0,
  nodeSpacing: 30,
  spacingGrowth: 'linear',
  centerX: 500,
  centerY: 400,
  maxRadius: 300,
};

// Pure function to calculate coordinates for an individual using spiral layout
export function getIndividualCoord(
  id: string,
  width: number,
  height: number,
  familyData?: AugmentedIndividual[],
  spiralConfig?: Partial<SpiralLayoutConfig>
): { x: number; y: number } {
  // Fallback to hash-based positioning if no family data is provided
  if (!familyData || familyData.length === 0) {
    return getHashBasedCoord(id, width, height);
  }

  // Create a hash of family data to detect changes
  const familyDataHash = JSON.stringify(familyData.map(ind => ind.id).sort());
  
  // Check if we need to recalculate positions
  if (familyDataHash !== lastFamilyDataHash || !spiralTransformer) {
    lastFamilyDataHash = familyDataHash;
    
    // Update config with dimensions and any overrides
    const config: SpiralLayoutConfig = {
      ...DEFAULT_SPIRAL_CONFIG,
      ...spiralConfig,
      centerX: width / 2,
      centerY: height / 2,
      maxRadius: Math.min(width, height) * 0.4,
    };

    // Find a suitable primary individual if not specified
    if (config.layoutMode === 'primary-center' && !config.primaryIndividualId) {
      const primaryCandidate = findSuitablePrimaryIndividual(familyData);
      config.primaryIndividualId = primaryCandidate?.id;
    }

    // Create new transformer and calculate positions
    spiralTransformer = new SpiralLayoutTransformer(config);
    const positions = spiralTransformer.transform(familyData);
    
    // Update position cache
    positionCache.clear();
    positions.forEach(pos => {
      positionCache.set(pos.id, pos);
    });
  }

  // Return cached position or fallback
  const position = positionCache.get(id);
  if (position) {
    return { x: position.x, y: position.y };
  }

  // Fallback to hash-based positioning
  return getHashBasedCoord(id, width, height);
}

// Original hash-based coordinate calculation as fallback
function getHashBasedCoord(
  id: string,
  width: number,
  height: number,
): { x: number; y: number } {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) + hash + id.charCodeAt(i);
  }
  const x = (((hash >>> 0) % 1000) / 1000) * width * 0.8 + width * 0.1;
  const y = ((((hash * 31) >>> 0) % 1000) / 1000) * height * 0.8 + height * 0.1;
  return { x, y };
}

// Find a suitable primary individual (one with many connections)
function findSuitablePrimaryIndividual(individuals: AugmentedIndividual[]): AugmentedIndividual | null {
  if (individuals.length === 0) return null;
  
  // Find individual with most connections
  let bestIndividual = individuals[0];
  let maxConnections = 0;
  
  for (const individual of individuals) {
    const connectionCount = 
      individual.parents.length + 
      individual.children.length + 
      individual.spouses.length + 
      individual.siblings.length;
    
    if (connectionCount > maxConnections) {
      maxConnections = connectionCount;
      bestIndividual = individual;
    }
  }
  
  return bestIndividual;
}

// Function to update spiral configuration globally
export function updateSpiralConfig(config: Partial<SpiralLayoutConfig>): void {
  if (spiralTransformer) {
    spiralTransformer.updateConfig(config);
    positionCache.clear(); // Force recalculation on next render
  }
}

// Function to clear position cache (useful for forcing recalculation)
export function clearPositionCache(): void {
  positionCache.clear();
  lastFamilyDataHash = '';
  spiralTransformer = null;
}

// Pure function to generate unique edges between individuals
export function getUniqueEdges(
  individuals: AugmentedIndividual[],
): [string, string][] {
  const edges = new Set<string>();
  const result: [string, string][] = [];
  for (const ind of individuals) {
    const connections = new Set([
      ...ind.parents,
      ...ind.spouses,
      ...ind.children,
      ...ind.siblings,
    ]);
    for (const relId of connections) {
      if (relId === ind.id) continue;
      const key = [ind.id, relId].sort().join('|');
      if (!edges.has(key)) {
        edges.add(key);
        result.push([ind.id, relId]);
      }
    }
  }
  return result;
}
