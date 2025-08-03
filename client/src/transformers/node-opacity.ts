/**
 * Node Opacity Transformer
 *
 * Adjusts the opacity of individual nodes based on various factors:
 * - Generation depth (deeper generations more transparent)
 * - Number of children (more children = more opaque)
 * - Age/lifespan (longer life = more opaque)
 * - Family importance (based on family size)
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
} from './types';
import { getIndividualOrWarn } from './utils/transformer-guards';

/**
 * Calculate node opacity based on selected dimensions
 */
function calculateNodeOpacity(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, dimensions, visual } = context;

  // Find the individual with null check
  const individual = getIndividualOrWarn(
    gedcomData,
    individualId,
    'Node opacity transformer',
  );
  if (!individual) {
    return 0.5; // Return default opacity
  }

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'generation': {
      // Invert generation value so earlier generations are more opaque
      const generationValue =
        individual.metadata?.relativeGenerationValue ?? 0.5;
      primaryValue = 1 - generationValue;
      break;
    }
    case 'childrenCount': {
      // More children = more opaque
      const allIndividuals = Object.values(gedcomData.individuals).filter(
        (ind) => ind !== null && ind !== undefined,
      );
      const childrenCounts = allIndividuals.map((ind) => {
        const children = allIndividuals.filter((child) =>
          child?.parents?.includes(ind.id),
        );
        return children.length;
      });
      const maxChildren =
        childrenCounts.length > 0 ? Math.max(...childrenCounts) : 0;
      const individualChildren = allIndividuals.filter((child) =>
        child?.parents?.includes(individual.id),
      ).length;
      primaryValue = maxChildren > 0 ? individualChildren / maxChildren : 0.5;
      break;
    }
    case 'lifespan': {
      // Longer life = more opaque
      const allLifespans = Object.values(gedcomData.individuals)
        .filter((ind) => ind !== null && ind !== undefined)
        .map((ind) => ind.metadata?.lifespan)
        .filter((span): span is number => span !== undefined && span > 0);
      if (allLifespans.length > 0) {
        const maxLifespan = Math.max(...allLifespans);
        const individualLifespan = individual.metadata?.lifespan ?? 0;
        primaryValue =
          maxLifespan > 0 && individualLifespan > 0
            ? individualLifespan / maxLifespan
            : 0.5;
      } else {
        primaryValue = 0.5;
      }
      break;
    }
    case 'distanceFromRoot': {
      // Calculate distance from root person (generation 0)
      const individualGeneration = individual.metadata?.generation ?? 0;
      const maxDistance = 10; // Assume max 10 generations distance
      primaryValue = Math.max(0, 1 - individualGeneration / maxDistance);
      break;
    }
  }

  // Get the secondary dimension value (if specified)
  const secondaryDimension = dimensions.secondary;
  let secondaryValue = 0.5; // Default fallback

  if (secondaryDimension && secondaryDimension !== primaryDimension) {
    switch (secondaryDimension) {
      case 'generation': {
        const generationValue =
          individual.metadata?.relativeGenerationValue ?? 0.5;
        secondaryValue = 1 - generationValue;
        break;
      }
      case 'childrenCount': {
        const allIndividuals = Object.values(gedcomData.individuals).filter(
          (ind) => ind !== null && ind !== undefined,
        );
        const childrenCounts = allIndividuals.map((ind) => {
          const children = allIndividuals.filter((child) =>
            child?.parents?.includes(ind.id),
          );
          return children.length;
        });
        const maxChildren =
          childrenCounts.length > 0 ? Math.max(...childrenCounts) : 0;
        const individualChildren = allIndividuals.filter((child) =>
          child?.parents?.includes(individual.id),
        ).length;
        secondaryValue =
          maxChildren > 0 ? individualChildren / maxChildren : 0.5;
        break;
      }
      case 'lifespan': {
        const allLifespans = Object.values(gedcomData.individuals)
          .filter((ind) => ind !== null && ind !== undefined)
          .map((ind) => ind.metadata?.lifespan)
          .filter((span): span is number => span !== undefined && span > 0);
        if (allLifespans.length > 0) {
          const maxLifespan = Math.max(...allLifespans);
          const individualLifespan = individual.metadata?.lifespan ?? 0;
          secondaryValue =
            maxLifespan > 0 && individualLifespan > 0
              ? individualLifespan / maxLifespan
              : 0.5;
        } else {
          secondaryValue = 0.5;
        }
        break;
      }
      case 'distanceFromRoot': {
        const individualGeneration = individual.metadata?.generation ?? 0;
        const maxDistance = 10;
        secondaryValue = Math.max(0, 1 - individualGeneration / maxDistance);
        break;
      }
    }
  }

  // Get visual parameters directly from context
  const { nodeOpacity } = visual;

  // Handle both numeric and string nodeOpacity values
  let baseOpacity: number;
  let opacityRange: { min: number; max: number };

  if (typeof nodeOpacity === 'number') {
    // Numeric nodeOpacity (from slider): use as base opacity
    baseOpacity = nodeOpacity;
    // Create range around the base opacity for variation
    const variation = 0.2; // ±20% variation range
    opacityRange = {
      min: Math.max(0.1, baseOpacity - variation),
      max: Math.min(1.0, baseOpacity + variation),
    };
  } else {
    // String nodeOpacity (legacy): map to ranges
    const opacityMap = {
      'very-transparent': { min: 0.2, max: 0.4 },
      transparent: { min: 0.3, max: 0.6 },
      'semi-transparent': { min: 0.5, max: 0.8 },
      opaque: { min: 0.7, max: 1.0 },
      'fully-opaque': { min: 0.9, max: 1.0 },
    };
    opacityRange =
      opacityMap[nodeOpacity as keyof typeof opacityMap] ||
      opacityMap['semi-transparent'];
    baseOpacity = (opacityRange.min + opacityRange.max) / 2;
  }

  // Combine primary and secondary dimensions (deterministic)
  const combinedValue = primaryValue * 0.7 + secondaryValue * 0.3;

  // Calculate final opacity within the range (no randomness)
  const finalOpacity =
    opacityRange.min + combinedValue * (opacityRange.max - opacityRange.min);

  // Ensure valid opacity range and handle NaN
  const safeOpacity = Math.max(0.1, Math.min(1.0, finalOpacity));
  return isNaN(safeOpacity) || !isFinite(safeOpacity) ? 0.5 : safeOpacity;
}

/**
 * Node opacity transform function
 * Applies opacity calculations to all individuals based on selected dimensions
 */
export async function nodeOpacityTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata } = context;

  const individuals = Object.values(gedcomData.individuals).filter(
    (individual) => individual !== null && individual !== undefined,
  );
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Apply opacity calculations to each individual
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals?.[individual.id] ?? {};
    const calculatedOpacity = calculateNodeOpacity(context, individual.id);

    // Preserve existing visual metadata and update opacity
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      opacity: calculatedOpacity,
    };
  });

  // Small delay to simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}
