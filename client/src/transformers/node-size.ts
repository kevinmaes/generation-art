/**
 * Node Size Transformer
 *
 * This transformer controls the size of nodes based on metadata like
 * number of children, age at death, or importance metrics.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
} from './types';
import { getIndividualOrWarn } from './utils/transformer-guards';

/**
 * Calculate node size based on selected dimensions
 */
function calculateNodeSize(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, dimensions, visual, temperature } = context;

  // Find the individual with null check
  const individual = getIndividualOrWarn(gedcomData, individualId, 'Node size transformer');
  if (!individual) {
    return 15; // Return default size
  }

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'childrenCount': {
      // Count children by looking at parent relationships
      const allIndividuals = Object.values(gedcomData.individuals)
        .filter((ind) => ind !== null && ind !== undefined);
      const childrenCounts = allIndividuals.map((ind) => {
        const children = allIndividuals.filter((child) =>
          child?.parents?.includes(ind.id),
        );
        return children.length;
      });
      const maxChildren = Math.max(...childrenCounts);
      const individualChildren = allIndividuals.filter((child) =>
        child?.parents?.includes(individual.id),
      ).length;
      primaryValue = maxChildren > 0 ? individualChildren / maxChildren : 0.5;
      break;
    }
    case 'lifespan': {
      const allLifespans = Object.values(gedcomData.individuals)
        .filter((ind) => ind !== null && ind !== undefined)
        .map((ind) => ind.metadata?.lifespan)
        .filter((span): span is number => span !== undefined);
      if (allLifespans.length > 0) {
        const maxLifespan = Math.max(...allLifespans);
        primaryValue =
          maxLifespan > 0
            ? (individual.metadata?.lifespan ?? 0) / maxLifespan
            : 0.5;
      }
      break;
    }
    case 'generation': {
      // Invert generation value so earlier generations are larger
      const generationValue =
        individual.metadata?.relativeGenerationValue ?? 0.5;
      primaryValue = 1 - generationValue;
      break;
    }
    case 'marriageCount': {
      // Count marriages by checking families where individual is spouse
      const families = Object.values(gedcomData.families)
        .filter((family) => family !== null && family !== undefined);
      const marriageCount = families.filter(
        (family) =>
          family.husband?.id === individualId ||
          family.wife?.id === individualId,
      ).length;
      const allMarriageCounts = Object.values(gedcomData.individuals)
        .filter((ind) => ind !== null && ind !== undefined)
        .map((ind) => {
          return families.filter(
            (family) =>
              family.husband?.id === ind.id || family.wife?.id === ind.id,
          ).length;
        });
      const maxMarriages = Math.max(...allMarriageCounts);
      primaryValue = maxMarriages > 0 ? marriageCount / maxMarriages : 0.5;
      break;
    }
  }

  // Get the secondary dimension value (if specified)
  const secondaryDimension = dimensions.secondary;
  let secondaryValue = 0.5; // Default fallback

  if (secondaryDimension && secondaryDimension !== primaryDimension) {
    switch (secondaryDimension) {
      case 'childrenCount': {
        const allIndividuals = Object.values(gedcomData.individuals)
          .filter((ind) => ind !== null && ind !== undefined);
        const childrenCounts = allIndividuals.map((ind) => {
          const children = allIndividuals.filter((child) =>
            child?.parents?.includes(ind.id),
          );
          return children.length;
        });
        const maxChildren = Math.max(...childrenCounts);
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
          .filter((span): span is number => span !== undefined);
        if (allLifespans.length > 0) {
          const maxLifespan = Math.max(...allLifespans);
          secondaryValue =
            maxLifespan > 0
              ? (individual.metadata?.lifespan ?? 0) / maxLifespan
              : 0.5;
        }
        break;
      }
      case 'generation': {
        const generationValue =
          individual.metadata?.relativeGenerationValue ?? 0.5;
        secondaryValue = 1 - generationValue;
        break;
      }
      case 'marriageCount': {
        const families = Object.values(gedcomData.families)
          .filter((family) => family !== null && family !== undefined);
        const marriageCount = families.filter(
          (family) =>
            family.husband?.id === individualId ||
            family.wife?.id === individualId,
        ).length;
        const allMarriageCounts = Object.values(gedcomData.individuals)
          .filter((ind) => ind !== null && ind !== undefined)
          .map((ind) => {
            return families.filter(
              (family) =>
                family.husband?.id === ind.id || family.wife?.id === ind.id,
            ).length;
          });
        const maxMarriages = Math.max(...allMarriageCounts);
        secondaryValue = maxMarriages > 0 ? marriageCount / maxMarriages : 0.5;
        break;
      }
    }
  }

  // Get visual parameters directly from context
  const { nodeSize, variationFactor } = visual;
  const temp = temperature ?? 0.5;

  // Convert node size string to base size values
  const sizeMap = {
    small: { min: 10, max: 20 },
    medium: { min: 15, max: 35 },
    large: { min: 25, max: 50 },
    'extra-large': { min: 35, max: 70 },
  };
  const sizeRange = sizeMap[nodeSize as keyof typeof sizeMap];

  // Combine primary and secondary dimensions with variation factor
  const combinedValue = primaryValue * 0.7 + secondaryValue * 0.3;

  // Add temperature-based randomness with variation factor influence
  const baseRandomness = (Math.random() - 0.5) * temp * 0.3; // ±15% max variation
  const variationRandomness =
    (Math.random() - 0.5) * (variationFactor as number) * 0.2; // Additional variation
  const totalRandomFactor = baseRandomness + variationRandomness;

  const adjustedDimensionValue = Math.max(
    0,
    Math.min(1, combinedValue + totalRandomFactor),
  );

  // Calculate final size within the range
  const finalSize =
    sizeRange.min + adjustedDimensionValue * (sizeRange.max - sizeRange.min);

  return finalSize;
}

/**
 * Node size transform function
 * Applies size calculations to all individuals based on selected dimensions
 */
export async function nodeSizeTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata } = context;

  const individuals = Object.values(gedcomData.individuals)
    .filter((individual) => individual !== null && individual !== undefined);
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Apply size calculations to each individual
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals?.[individual.id] ?? {};
    const calculatedSize = calculateNodeSize(context, individual.id);

    // Preserve existing visual metadata and update size
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      size: calculatedSize,
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
