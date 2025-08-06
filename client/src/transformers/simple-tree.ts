/**
 * Simple Tree Layout Transformer
 *
 * This transformer creates a traditional family tree layout with generations
 * arranged in rows. The primary individual is positioned near the bottom center,
 * with ancestors arranged in generations above and descendants below.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  VisualTransformerConfig,
} from './types';
import type { AugmentedIndividual, Family } from '../../../shared/types';
import { createTransformerInstance } from './utils';

/**
 * Configuration for the simple tree transformer
 */
export const simpleTreeConfig: VisualTransformerConfig = {
  id: 'simple-tree',
  name: 'Simple Tree Layout',
  description:
    'Creates a traditional family tree layout with generations arranged in horizontal rows. Places the primary individual at the bottom center and arranges ancestors in generations above.',
  shortDescription: 'Traditional family tree layout',
  transform: simpleTreeTransform,
  categories: ['layout', 'positioning'],
  availableDimensions: ['generation'],
  defaultPrimaryDimension: 'generation',
  visualParameters: [],
  getDefaults: () => ({}),
  createTransformerInstance: (params) =>
    createTransformerInstance(params, simpleTreeTransform, []),
};

/**
 * Group individuals within a generation by their family relationships
 */
function groupIndividualsByFamilies(
  individuals: AugmentedIndividual[],
  families: Family[]
): AugmentedIndividual[][] {
  const familyGroups: AugmentedIndividual[][] = [];
  const processed = new Set<string>();

  individuals.forEach((individual) => {
    if (processed.has(individual.id)) return;

    // Find family where this person is a spouse
    const spouseFamily = families.find(
      (family) => 
        family.husband?.id === individual.id || 
        family.wife?.id === individual.id
    );

    if (spouseFamily) {
      // Group spouses together
      const familyMembers: AugmentedIndividual[] = [];
      
      if (spouseFamily.husband && !processed.has(spouseFamily.husband.id)) {
        const husband = individuals.find(ind => ind.id === spouseFamily.husband?.id);
        if (husband) {
          familyMembers.push(husband);
          processed.add(husband.id);
        }
      }
      
      if (spouseFamily.wife && !processed.has(spouseFamily.wife.id)) {
        const wife = individuals.find(ind => ind.id === spouseFamily.wife?.id);
        if (wife) {
          familyMembers.push(wife);
          processed.add(wife.id);
        }
      }

      if (familyMembers.length > 0) {
        familyGroups.push(familyMembers);
      }
    } else {
      // Single individual not in a spousal relationship in this generation
      familyGroups.push([individual]);
      processed.add(individual.id);
    }
  });

  return familyGroups;
}

/**
 * Calculate horizontal positions for family groups with appropriate spacing
 * Returns both positioning data and the optimal node size for this generation
 */
function calculateFamilyPositions(
  familyGroups: AugmentedIndividual[][],
  canvasWidth: number,
  horizontalMargin: number,
  baseNodeSize: number
): { positions: { individuals: AugmentedIndividual[]; startX: number; spacing: number }[]; optimalNodeSize: number } {
  const results: { individuals: AugmentedIndividual[]; startX: number; spacing: number }[] = [];
  
  if (familyGroups.length === 0) return { positions: results, optimalNodeSize: baseNodeSize };

  const totalWidth = canvasWidth - horizontalMargin * 2;
  
  // Calculate ideal spacing ratios (will scale with node size)
  const spouseSpacingRatio = 1.3; // Small gap between spouses
  const familySpacingRatio = 3.0; // Larger gap between families
  
  // Calculate total width needed with base node size
  function calculateNeededWidth(nodeSize: number): number {
    const spouseSpacing = nodeSize * spouseSpacingRatio;
    const familySpacing = nodeSize * familySpacingRatio;
    
    let totalNeeded = 0;
    familyGroups.forEach((family, index) => {
      if (family.length > 1) {
        totalNeeded += (family.length - 1) * spouseSpacing + nodeSize;
      } else {
        totalNeeded += nodeSize;
      }
      if (index < familyGroups.length - 1) {
        totalNeeded += familySpacing;
      }
    });
    return totalNeeded;
  }
  
  // Find optimal node size that fits everything
  let optimalNodeSize = baseNodeSize;
  let totalNeededWidth = calculateNeededWidth(optimalNodeSize);
  
  if (totalNeededWidth > totalWidth) {
    // Scale down node size to fit
    optimalNodeSize = (totalWidth * baseNodeSize) / totalNeededWidth;
    // Set minimum node size to keep things readable
    optimalNodeSize = Math.max(6, optimalNodeSize);
    totalNeededWidth = calculateNeededWidth(optimalNodeSize);
    
  }
  
  // Calculate actual spacing with optimal node size
  const actualSpouseSpacing = optimalNodeSize * spouseSpacingRatio;
  const actualFamilySpacing = optimalNodeSize * familySpacingRatio;

  // Center the entire group
  const startX = horizontalMargin + (totalWidth - totalNeededWidth) / 2;
  let currentX = startX;

  familyGroups.forEach((family, familyIndex) => {
    results.push({
      individuals: family,
      startX: currentX,
      spacing: actualSpouseSpacing
    });

    // Move to next family position
    if (family.length > 1) {
      currentX += (family.length - 1) * actualSpouseSpacing + optimalNodeSize;
    } else {
      currentX += optimalNodeSize;
    }
    
    if (familyIndex < familyGroups.length - 1) {
      currentX += actualFamilySpacing;
    }
  });

  return { positions: results, optimalNodeSize };
}


/**
 * Calculate tree layout positions for all individuals
 */
function calculateTreeLayout(
  context: TransformerContext,
  baseNodeSize: number,
): Record<string, { x: number; y: number; nodeSize: number }> {
  const { gedcomData, visualMetadata } = context;
  const families = Object.values(gedcomData.families);
  const canvasWidth = visualMetadata.global.canvasWidth ?? 800;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 600;
  const positions: Record<string, { x: number; y: number; nodeSize: number }> = {};

  const individuals = Object.values(gedcomData.individuals).filter(
    (individual) => individual !== null && individual !== undefined,
  );

  if (individuals.length === 0) {
    return positions;
  }

  // Find the primary individual - the one with the most descendants or the youngest with ancestors
  let primaryGeneration = 0;
  
  // If most individuals have high generation numbers (root ancestors at 0), 
  // we need to find a good focal point in the middle/lower generations
  const generationCounts: Record<number, number> = {};
  individuals.forEach((ind) => {
    const gen = ind.metadata?.generation ?? 0;
    generationCounts[gen] = (generationCounts[gen] || 0) + 1;
  });
  
  // Find the median generation to use as primary
  const sortedGenerations = Object.keys(generationCounts)
    .map(Number)
    .sort((a, b) => a - b);
  
  if (sortedGenerations.length > 0) {
    // Use a generation near the middle or lower third as primary
    const targetIndex = Math.floor(sortedGenerations.length * 0.7);
    primaryGeneration = sortedGenerations[targetIndex];
    
    // We found the primary generation to use as our reference point
  }

  // Group individuals by generation relative to primary
  const generationGroups: Record<number, AugmentedIndividual[]> = {};
  let minGeneration = Number.MAX_SAFE_INTEGER;
  let maxGeneration = Number.MIN_SAFE_INTEGER;

  individuals.forEach((individual) => {
    const absoluteGeneration = individual.metadata?.generation ?? 0;
    // Convert to relative generation where primary is 0
    const relativeGeneration = absoluteGeneration - primaryGeneration;
    
    if (!generationGroups[relativeGeneration]) {
      generationGroups[relativeGeneration] = [];
    }
    generationGroups[relativeGeneration].push(individual);
    minGeneration = Math.min(minGeneration, relativeGeneration);
    maxGeneration = Math.max(maxGeneration, relativeGeneration);
  });

  const totalGenerations = maxGeneration - minGeneration + 1;
  const verticalMargin = 100; // Larger margin for better spacing from edges
  const horizontalMargin = 80;
  
  // Calculate vertical spacing to distribute generations evenly
  const availableHeight = canvasHeight - verticalMargin * 2;
  const verticalSpacing = totalGenerations > 1 
    ? availableHeight / (totalGenerations - 1)
    : 0;




  // First pass: Calculate optimal node size for ALL generations
  let globalOptimalNodeSize = baseNodeSize;
  
  Object.entries(generationGroups).forEach(([, genIndividuals]) => {
    const familyGroups = groupIndividualsByFamilies(genIndividuals, families);
    const { optimalNodeSize } = calculateFamilyPositions(
      familyGroups,
      canvasWidth,
      horizontalMargin,
      baseNodeSize
    );
    
    // Use the smallest optimal size across all generations
    globalOptimalNodeSize = Math.min(globalOptimalNodeSize, optimalNodeSize);
  });

  // Second pass: Position all individuals using consistent node size
  Object.entries(generationGroups).forEach(([genStr, genIndividuals]) => {
    const generation = parseInt(genStr, 10);

    // Position from top to bottom: highest generation (grandparents) at top,
    // lowest generation (descendants) at bottom
    // Invert the index since higher generation numbers should be at the top
    const generationIndex = maxGeneration - generation;
    const baseY = verticalMargin + generationIndex * verticalSpacing;

    // Group individuals by families for better positioning
    const familyGroups = groupIndividualsByFamilies(genIndividuals, families);
    
    
    // Calculate positions using global optimal node size
    const { positions: familyPositions } = calculateFamilyPositions(
      familyGroups,
      canvasWidth,
      horizontalMargin,
      globalOptimalNodeSize
    );

    // Assign positions to individuals with consistent node size
    familyPositions.forEach(({ individuals: familyMembers, startX, spacing }) => {
      familyMembers.forEach((individual, index) => {
        const x = startX + index * spacing;
        const y = baseY;
        positions[individual.id] = { 
          x, 
          y, 
          nodeSize: globalOptimalNodeSize // Same size for all individuals
        };
      });
    });
  });

  return positions;
}

/**
 * Simple tree layout transform function
 */
export async function simpleTreeTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata } = context;
  
  const individuals = Object.values(gedcomData.individuals).filter(
    (individual) => individual !== null && individual !== undefined,
  );

  // Calculate adaptive node size based on canvas dimensions
  const canvasWidth = visualMetadata.global.canvasWidth ?? 800;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 600;
  
  // Estimate reasonable node size based on space available
  const baseNodeSize = Math.min(canvasWidth, canvasHeight) * 0.02; // 2% of smaller dimension
  const nodeSize = Math.max(8, Math.min(50, baseNodeSize)); // Between 8px and 50px

  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Calculate positions for all individuals
  const positions = calculateTreeLayout(context, nodeSize);

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals[individual.id] ?? {};
    const position = positions[individual.id];

    if (position) {
      const visualData = {
        ...currentMetadata,
        x: position.x,
        y: position.y,
        size: position.nodeSize, // Use optimal size per individual
        width: 1.0,
        height: 1.0,
        shape: 'square' as const,
        color: '#4A90E2',
        strokeColor: '#000',
        strokeWeight: 2,
        opacity: 1,
      };
      
      updatedIndividuals[individual.id] = visualData;
      
      
    }
  });
  

  // Create edge visual metadata
  const updatedEdges: Record<string, VisualMetadata> = {};

  gedcomData.metadata.edges.forEach((edge) => {
    const sourcePos = positions[edge.sourceId];
    const targetPos = positions[edge.targetId];

    if (sourcePos && targetPos) {
      // Calculate edge position as center point between nodes
      const edgeX = (sourcePos.x + targetPos.x) / 2;
      const edgeY = (sourcePos.y + targetPos.y) / 2;

      const currentEdgeMetadata = visualMetadata.edges[edge.id] ?? {};

      updatedEdges[edge.id] = {
        ...currentEdgeMetadata,
        x: edgeX,
        y: edgeY,
        strokeColor: '#666',
        strokeWeight: 1,
        strokeStyle: 'solid' as const,
        opacity: 0.8,
        curveType: 'straight' as const,
        // Store source and target positions for rendering
        custom: {
          sourceX: sourcePos.x,
          sourceY: sourcePos.y,
          targetX: targetPos.x,
          targetY: targetPos.y,
        },
      };
    }
  });

  // Small delay to simulate async work (consistent with other transformers)
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
      edges: updatedEdges,
    },
  };
}
