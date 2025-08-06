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
import type { AugmentedIndividual } from '../../../shared/types';
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
 * Calculate tree layout positions for all individuals
 */
function calculateTreeLayout(
  context: TransformerContext,
  nodeSize: number,
): Record<string, { x: number; y: number }> {
  const { gedcomData, visualMetadata } = context;
  const canvasWidth = visualMetadata.global.canvasWidth ?? 800;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 600;
  const positions: Record<string, { x: number; y: number }> = {};

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




  // Calculate Y positions based on generation structure
  Object.entries(generationGroups).forEach(([genStr, genIndividuals]) => {
    const generation = parseInt(genStr, 10);

    // Position from top to bottom: highest generation (grandparents) at top,
    // lowest generation (descendants) at bottom
    // Invert the index since higher generation numbers should be at the top
    const generationIndex = maxGeneration - generation;
    const baseY = verticalMargin + generationIndex * verticalSpacing;

    // Calculate horizontal positions - center the generation on canvas
    const generationSize = genIndividuals.length;
    const nodeWidth = nodeSize; // Size of the nodes (matches nodeSize)
    const minSpacing = nodeWidth * 1.2; // Minimum spacing between nodes
    const totalWidth = canvasWidth - horizontalMargin * 2;
    
    let horizontalSpacing: number;
    let startX: number;
    
    if (generationSize === 1) {
      // Single node - center it
      startX = canvasWidth / 2;
      horizontalSpacing = 0;
    } else {
      // Multiple nodes - calculate spacing that fits on canvas
      const maxPossibleSpacing = totalWidth / (generationSize - 1);
      horizontalSpacing = Math.min(maxPossibleSpacing, minSpacing);
      
      // If nodes don't fit with minimum spacing, use maximum available width
      if (horizontalSpacing < minSpacing) {
        horizontalSpacing = totalWidth / Math.max(1, generationSize - 1);
      }
      
      // Center the group
      const groupWidth = horizontalSpacing * Math.max(0, generationSize - 1);
      startX = horizontalMargin + (totalWidth - groupWidth) / 2;
      
      // Ensure startX is never negative
      startX = Math.max(horizontalMargin, startX);
    }


    genIndividuals.forEach((individual, index) => {
      const x = startX + index * horizontalSpacing;
      const y = baseY;

      positions[individual.id] = { x, y };
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
        size: nodeSize,
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
