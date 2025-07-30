/**
 * Edge Opacity Transformer
 *
 * Adjusts the opacity of edges based on various factors:
 * - Relationship type (parent-child vs spouse vs sibling)
 * - Generation distance between connected individuals
 * - Family importance (based on number of children)
 * - Edge length (longer edges more transparent)
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
} from './types';

/**
 * Calculate edge opacity based on selected dimensions and edge properties
 */
function calculateEdgeOpacity(
  context: TransformerContext,
  edgeId: string,
): number {
  const { gedcomData, visualMetadata, dimensions, visual, temperature } =
    context;

  // Find the edge
  const edge = gedcomData.metadata.edges.find((e) => e.id === edgeId);
  if (!edge) return 0.5;

  const sourceIndividual = gedcomData.individuals[edge.sourceId];
  const targetIndividual = gedcomData.individuals[edge.targetId];

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'generation': {
      // Generation distance (closer generations = higher value)
      const sourceGen = sourceIndividual.metadata.generation ?? 0;
      const targetGen = targetIndividual.metadata.generation ?? 0;
      const genDistance = Math.abs(sourceGen - targetGen);
      const maxGenDistance = 5; // Assume max 5 generations apart
      primaryValue = Math.max(0, 1 - genDistance / maxGenDistance);
      break;
    }
    case 'childrenCount': {
      // Combined children count of connected individuals
      const allIndividuals = Object.values(gedcomData.individuals);
      const sourceChildren = allIndividuals.filter((child) =>
        child.parents.includes(sourceIndividual.id),
      ).length;
      const targetChildren = allIndividuals.filter((child) =>
        child.parents.includes(targetIndividual.id),
      ).length;
      const totalChildren = sourceChildren + targetChildren;
      const maxChildrenSum = 20; // Assume max 20 combined children
      primaryValue = Math.min(1, totalChildren / maxChildrenSum);
      break;
    }
    case 'lifespan': {
      // Average lifespan of connected individuals
      const sourceLifespan = sourceIndividual.metadata.lifespan ?? 0;
      const targetLifespan = targetIndividual.metadata.lifespan ?? 0;
      const avgLifespan = (sourceLifespan + targetLifespan) / 2;
      const maxLifespan = 100; // Assume max 100 years
      primaryValue = avgLifespan / maxLifespan;
      break;
    }
    case 'relationshipDensity': {
      // Relationship type strength
      if (edge.relationshipType === 'parent-child') {
        primaryValue = 1.0; // Strongest
      } else if (edge.relationshipType === 'spouse') {
        primaryValue = 0.8; // Strong
      } else {
        primaryValue = 0.6; // Moderate (sibling or other)
      }
      break;
    }
  }

  // Get the secondary dimension value (if specified)
  const secondaryDimension = dimensions.secondary;
  let secondaryValue = 0.5; // Default fallback

  if (secondaryDimension && secondaryDimension !== primaryDimension) {
    switch (secondaryDimension) {
      case 'generation': {
        const sourceGen = sourceIndividual.metadata.generation ?? 0;
        const targetGen = targetIndividual.metadata.generation ?? 0;
        const genDistance = Math.abs(sourceGen - targetGen);
        const maxGenDistance = 5;
        secondaryValue = Math.max(0, 1 - genDistance / maxGenDistance);
        break;
      }
      case 'childrenCount': {
        const allIndividuals = Object.values(gedcomData.individuals);
        const sourceChildren = allIndividuals.filter((child) =>
          child.parents.includes(sourceIndividual.id),
        ).length;
        const targetChildren = allIndividuals.filter((child) =>
          child.parents.includes(targetIndividual.id),
        ).length;
        const totalChildren = sourceChildren + targetChildren;
        const maxChildrenSum = 20;
        secondaryValue = Math.min(1, totalChildren / maxChildrenSum);
        break;
      }
      case 'lifespan': {
        const sourceLifespan = sourceIndividual.metadata.lifespan ?? 0;
        const targetLifespan = targetIndividual.metadata.lifespan ?? 0;
        const avgLifespan = (sourceLifespan + targetLifespan) / 2;
        const maxLifespan = 100;
        secondaryValue = avgLifespan / maxLifespan;
        break;
      }
      case 'relationshipDensity': {
        if (edge.relationshipType === 'parent-child') {
          secondaryValue = 1.0;
        } else if (edge.relationshipType === 'spouse') {
          secondaryValue = 0.8;
        } else {
          secondaryValue = 0.6; // sibling or other
        }
        break;
      }
    }
  }

  // Get visual parameters directly from context
  const { edgeOpacity, variationFactor } = visual;
  const temp = temperature ?? 0.5;

  // Use edge opacity directly as base opacity (0.1 to 1.0 range)
  const baseOpacity = typeof edgeOpacity === 'number' ? edgeOpacity : 0.7;
  const opacityRange = {
    min: Math.max(0.1, baseOpacity - 0.2),
    max: Math.min(1.0, baseOpacity + 0.2),
  };

  // Factor in edge length (longer edges = more transparent)
  const sourceIndividualVisual = visualMetadata.individuals[edge.sourceId];
  const targetIndividualVisual = visualMetadata.individuals[edge.targetId];

  const sourceX = sourceIndividualVisual.x ?? 0;
  const sourceY = sourceIndividualVisual.y ?? 0;
  const targetX = targetIndividualVisual.x ?? 0;
  const targetY = targetIndividualVisual.y ?? 0;
  const distance = Math.sqrt(
    (targetX - sourceX) ** 2 + (targetY - sourceY) ** 2,
  );
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;
  const maxDistance = Math.sqrt(canvasWidth ** 2 + canvasHeight ** 2);
  const distanceFactor = Math.max(0.5, 1 - (distance / maxDistance) * 0.3);

  // Combine primary and secondary dimensions with distance factor
  const combinedValue =
    (primaryValue * 0.6 + secondaryValue * 0.2) * distanceFactor;

  // Add temperature-based randomness with variation factor influence
  const baseRandomness = (Math.random() - 0.5) * temp * 0.2; // ±10% max variation
  const variationRandomness =
    (Math.random() - 0.5) * (variationFactor as number) * 0.15; // Additional variation
  const totalRandomFactor = baseRandomness + variationRandomness;

  const adjustedDimensionValue = Math.max(
    0,
    Math.min(1, combinedValue + totalRandomFactor),
  );

  // Calculate final opacity within the range
  const finalOpacity =
    opacityRange.min +
    adjustedDimensionValue * (opacityRange.max - opacityRange.min);

  return Math.max(0.1, Math.min(1.0, finalOpacity)); // Ensure valid opacity range
}

/**
 * Calculate edge width based on relationship type and visual parameters
 */
function calculateEdgeWidth(
  context: TransformerContext,
  edgeId: string,
): number {
  const { gedcomData, visual, temperature } = context;

  // Find the edge
  const edge = gedcomData.metadata.edges.find((e) => e.id === edgeId);
  if (!edge) return 1;

  // Get visual parameters
  const { edgeWidth, variationFactor } = visual;
  const temp = temperature ?? 0.5;

  // Use edge width directly as base width value
  const baseWidth = typeof edgeWidth === 'number' ? edgeWidth : 2;
  const widthRange = { min: Math.max(0.5, baseWidth - 1), max: baseWidth + 2 };

  // Base width on relationship type
  let baseValue = 0.5;
  if (edge.relationshipType === 'parent-child') {
    baseValue = 0.9; // Thickest
  } else if (edge.relationshipType === 'spouse') {
    baseValue = 0.7; // Thick
  } else {
    baseValue = 0.5; // Medium (sibling or other)
  }

  // Add temperature-based randomness
  const randomness = (Math.random() - 0.5) * temp * 0.3;
  const variationRandomness =
    (Math.random() - 0.5) * (variationFactor as number) * 0.2;
  const adjustedValue = Math.max(
    0,
    Math.min(1, baseValue + randomness + variationRandomness),
  );

  // Calculate final width within the range
  const finalWidth =
    widthRange.min + adjustedValue * (widthRange.max - widthRange.min);

  return finalWidth;
}

/**
 * Edge opacity transform function
 * Applies opacity and width calculations to all edges based on selected dimensions
 */
export async function edgeOpacityTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata, visual } = context;

  const edges = gedcomData.metadata.edges;
  if (edges.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated edge visual metadata
  const updatedEdges: Record<string, VisualMetadata> = {};

  // Apply opacity and width calculations to each edge
  edges.forEach((edge) => {
    const currentMetadata = visualMetadata.edges[edge.id] ?? {};
    const calculatedOpacity = calculateEdgeOpacity(context, edge.id);
    const calculatedWidth = calculateEdgeWidth(context, edge.id);

    // Get edge color from visual parameters
    const { secondaryColor } = visual;

    // Preserve existing visual metadata and update opacity, width, and color
    updatedEdges[edge.id] = {
      ...currentMetadata,
      opacity: calculatedOpacity,
      strokeWeight: calculatedWidth,
      color:
        (secondaryColor as string | undefined) ??
        visualMetadata.global.defaultEdgeColor ??
        '#666666',
    };
  });

  // Small delay to simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      edges: updatedEdges,
    },
  };
}
