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
  VisualTransformerConfig,
} from './types';
import {
  getIndividualOrWarn,
  validateEdgeReferences,
} from './utils/transformer-guards';
import { createTransformerInstance } from './utils';

/**
 * Configuration for the edge opacity transformer
 */
export const edgeOpacityConfig: VisualTransformerConfig = {
  id: 'edge-opacity',
  name: 'Edge Opacity',
  description: 'Sets edge transparency based on a selected dimension.',
  shortDescription: 'Edge opacity by dimension',
  transform: edgeOpacityTransform,
  categories: ['visual', 'edge'],
  availableDimensions: ['generation', 'lifespan', 'childrenCount'],
  defaultPrimaryDimension: 'generation',
  visualParameters: [],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, edgeOpacityTransform, []),
  multiInstance: false,
};

/**
 * Calculate edge opacity based on selected dimensions and edge properties
 */
function calculateEdgeOpacity(
  context: TransformerContext,
  edgeId: string,
): number {
  const { gedcomData, visualMetadata, dimensions, visual } = context;

  // Find the edge
  const edge = gedcomData.metadata.edges.find((e) => e.id === edgeId);
  if (!edge) return 0.5;

  // Validate edge references
  if (
    !validateEdgeReferences(gedcomData, edge.sourceId, edge.targetId, edgeId)
  ) {
    return 0.1; // Return very low opacity for invalid edges
  }

  const sourceIndividual = getIndividualOrWarn(
    gedcomData,
    edge.sourceId,
    'Edge opacity transformer',
  );
  const targetIndividual = getIndividualOrWarn(
    gedcomData,
    edge.targetId,
    'Edge opacity transformer',
  );

  if (!sourceIndividual || !targetIndividual) {
    return 0.1; // Return very low opacity if individuals not found
  }

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'generation': {
      // Generation distance (closer generations = higher value)
      const sourceGen = sourceIndividual.metadata?.generation ?? 0;
      const targetGen = targetIndividual.metadata?.generation ?? 0;
      const genDistance = Math.abs(sourceGen - targetGen);
      const maxGenDistance = 5; // Assume max 5 generations apart
      primaryValue = Math.max(0, 1 - genDistance / maxGenDistance);
      break;
    }
    case 'childrenCount': {
      // Combined children count of connected individuals
      const allIndividuals = Object.values(gedcomData.individuals).filter(
        (ind) => ind !== null && ind !== undefined,
      );
      const sourceChildren = allIndividuals.filter((child) =>
        child?.parents?.includes(sourceIndividual.id),
      ).length;
      const targetChildren = allIndividuals.filter((child) =>
        child?.parents?.includes(targetIndividual.id),
      ).length;
      const totalChildren = sourceChildren + targetChildren;
      const maxChildrenSum = 20; // Assume max 20 combined children
      primaryValue = Math.min(1, totalChildren / maxChildrenSum);
      break;
    }
    case 'lifespan': {
      // Average lifespan of connected individuals
      const sourceLifespan = sourceIndividual.metadata?.lifespan ?? 0;
      const targetLifespan = targetIndividual.metadata?.lifespan ?? 0;
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
        const sourceGen = sourceIndividual.metadata?.generation ?? 0;
        const targetGen = targetIndividual.metadata?.generation ?? 0;
        const genDistance = Math.abs(sourceGen - targetGen);
        const maxGenDistance = 5;
        secondaryValue = Math.max(0, 1 - genDistance / maxGenDistance);
        break;
      }
      case 'childrenCount': {
        const allIndividuals = Object.values(gedcomData.individuals).filter(
          (ind) => ind !== null && ind !== undefined,
        );
        const sourceChildren = allIndividuals.filter((child) =>
          child?.parents?.includes(sourceIndividual.id),
        ).length;
        const targetChildren = allIndividuals.filter((child) =>
          child?.parents?.includes(targetIndividual.id),
        ).length;
        const totalChildren = sourceChildren + targetChildren;
        const maxChildrenSum = 20;
        secondaryValue = Math.min(1, totalChildren / maxChildrenSum);
        break;
      }
      case 'lifespan': {
        const sourceLifespan = sourceIndividual.metadata?.lifespan ?? 0;
        const targetLifespan = targetIndividual.metadata?.lifespan ?? 0;
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
  const { edgeOpacity } = visual;

  // Use edge opacity as target opacity (with proper fallback)
  const targetOpacity =
    typeof edgeOpacity === 'number' && !isNaN(edgeOpacity) ? edgeOpacity : 0.7;

  // Factor in edge length (longer edges = more transparent)
  const sourceIndividualVisual = visualMetadata.individuals?.[edge.sourceId];
  const targetIndividualVisual = visualMetadata.individuals?.[edge.targetId];

  const sourceX = sourceIndividualVisual?.x ?? 0;
  const sourceY = sourceIndividualVisual?.y ?? 0;
  const targetX = targetIndividualVisual?.x ?? 0;
  const targetY = targetIndividualVisual?.y ?? 0;
  const distance = Math.sqrt(
    (targetX - sourceX) ** 2 + (targetY - sourceY) ** 2,
  );
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;
  const maxDistance = Math.sqrt(canvasWidth ** 2 + canvasHeight ** 2);
  const distanceFactor = Math.max(0.5, 1 - (distance / maxDistance) * 0.3);

  // Ensure no NaN values before combining
  const safePrimaryValue = isNaN(primaryValue) ? 0.5 : primaryValue;
  const safeSecondaryValue = isNaN(secondaryValue) ? 0.5 : secondaryValue;
  const safeDistanceFactor = isNaN(distanceFactor) ? 1.0 : distanceFactor;

  // Combine primary and secondary dimensions with distance factor (deterministic)
  const combinedValue =
    (safePrimaryValue * 0.6 + safeSecondaryValue * 0.2) * safeDistanceFactor;

  // Use target opacity more directly with minimal dimension influence (no randomness)
  const dimensionInfluence = isNaN(combinedValue)
    ? 1.0
    : combinedValue * 0.3 + 0.7; // Range: 0.7 to 1.0
  const finalOpacity = targetOpacity * dimensionInfluence;

  // Ensure we don't return NaN
  const safeOpacity = isNaN(finalOpacity) ? 0.7 : finalOpacity;

  return Math.max(0.1, Math.min(1.0, safeOpacity)); // Ensure valid opacity range
}

/**
 * Calculate edge width based on relationship type and visual parameters
 */
function calculateEdgeWidth(
  context: TransformerContext,
  edgeId: string,
): number {
  const { gedcomData, visual } = context;

  // Find the edge
  const edge = gedcomData.metadata.edges.find((e) => e.id === edgeId);
  if (!edge) return 1;

  // Get visual parameters
  const { edgeWidth } = visual;

  // Use edge width directly as base width value (with proper fallback)
  const baseWidth =
    typeof edgeWidth === 'number' && !isNaN(edgeWidth) ? edgeWidth : 2;
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

  // Calculate final width within the range (deterministic)
  const finalWidth =
    widthRange.min + baseValue * (widthRange.max - widthRange.min);

  // Ensure we don't return NaN
  const safeWidth = isNaN(finalWidth) ? 2 : finalWidth;

  return safeWidth;
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
      strokeColor:
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
