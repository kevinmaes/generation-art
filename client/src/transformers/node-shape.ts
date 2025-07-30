/**
 * Node Shape Transformer
 *
 * This transformer controls the shape of nodes based on metadata like
 * generation, gender, marriage status, or number of children.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
} from './types';

/**
 * Available node shapes
 */
const SHAPES = ['circle', 'square', 'triangle', 'hexagon', 'star'] as const;
type NodeShape = (typeof SHAPES)[number];

/**
 * Calculate node shape based on selected dimensions
 */
function calculateNodeShape(
  context: TransformerContext,
  individualId: string,
): NodeShape {
  const { gedcomData, dimensions, visual, temperature } = context;

  // Find the individual
  const individual = gedcomData.individuals[individualId];

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'generation': {
      const generationValue =
        individual.metadata.relativeGenerationValue ?? 0.5;
      primaryValue = generationValue;
      break;
    }
    case 'childrenCount': {
      // Count children by looking at parent relationships
      const allIndividuals = Object.values(gedcomData.individuals);
      const childrenCounts = allIndividuals.map((ind) => {
        const children = allIndividuals.filter((child) =>
          child.parents.includes(ind.id),
        );
        return children.length;
      });
      const maxChildren = Math.max(...childrenCounts);
      const individualChildren = allIndividuals.filter((child) =>
        child.parents.includes(individual.id),
      ).length;
      primaryValue = maxChildren > 0 ? individualChildren / maxChildren : 0.5;
      break;
    }
    case 'lifespan': {
      const allLifespans = Object.values(gedcomData.individuals)
        .map((ind) => ind.metadata.lifespan)
        .filter((span): span is number => span !== undefined);
      if (allLifespans.length > 0) {
        const maxLifespan = Math.max(...allLifespans);
        primaryValue =
          maxLifespan > 0
            ? (individual.metadata.lifespan ?? 0) / maxLifespan
            : 0.5;
      }
      break;
    }
    case 'marriageCount': {
      // Count marriages by checking families where individual is spouse
      const families = Object.values(gedcomData.families);
      const marriageCount = families.filter(
        (family) =>
          family.husband?.id === individualId ||
          family.wife?.id === individualId,
      ).length;
      const allMarriageCounts = Object.values(gedcomData.individuals).map(
        (ind) => {
          return families.filter(
            (family) =>
              family.husband?.id === ind.id || family.wife?.id === ind.id,
          ).length;
        },
      );
      const maxMarriages = Math.max(...allMarriageCounts);
      primaryValue = maxMarriages > 0 ? marriageCount / maxMarriages : 0.5;
      break;
    }
    case 'birthYear': {
      const allBirthYears = Object.values(gedcomData.individuals)
        .map((ind) => ind.metadata.birthYear)
        .filter((year): year is number => year !== undefined);
      if (allBirthYears.length > 0) {
        const minYear = Math.min(...allBirthYears);
        const maxYear = Math.max(...allBirthYears);
        const yearRange = maxYear - minYear;
        primaryValue =
          yearRange > 0
            ? ((individual.metadata.birthYear ?? minYear) - minYear) / yearRange
            : 0.5;
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
        const generationValue =
          individual.metadata.relativeGenerationValue ?? 0.5;
        secondaryValue = generationValue;
        break;
      }
      case 'childrenCount': {
        const allIndividuals = Object.values(gedcomData.individuals);
        const childrenCounts = allIndividuals.map((ind) => {
          const children = allIndividuals.filter((child) =>
            child.parents.includes(ind.id),
          );
          return children.length;
        });
        const maxChildren = Math.max(...childrenCounts);
        const individualChildren = allIndividuals.filter((child) =>
          child.parents.includes(individual.id),
        ).length;
        secondaryValue =
          maxChildren > 0 ? individualChildren / maxChildren : 0.5;
        break;
      }
      case 'lifespan': {
        const allLifespans = Object.values(gedcomData.individuals)
          .map((ind) => ind.metadata.lifespan)
          .filter((span): span is number => span !== undefined);
        if (allLifespans.length > 0) {
          const maxLifespan = Math.max(...allLifespans);
          secondaryValue =
            maxLifespan > 0
              ? (individual.metadata.lifespan ?? 0) / maxLifespan
              : 0.5;
        }
        break;
      }
      case 'marriageCount': {
        const families = Object.values(gedcomData.families);
        const marriageCount = families.filter(
          (family) =>
            family.husband?.id === individualId ||
            family.wife?.id === individualId,
        ).length;
        const allMarriageCounts = Object.values(gedcomData.individuals).map(
          (ind) => {
            return families.filter(
              (family) =>
                family.husband?.id === ind.id || family.wife?.id === ind.id,
            ).length;
          },
        );
        const maxMarriages = Math.max(...allMarriageCounts);
        secondaryValue = maxMarriages > 0 ? marriageCount / maxMarriages : 0.5;
        break;
      }
      case 'birthYear': {
        const allBirthYears = Object.values(gedcomData.individuals)
          .map((ind) => ind.metadata.birthYear)
          .filter((year): year is number => year !== undefined);
        if (allBirthYears.length > 0) {
          const minYear = Math.min(...allBirthYears);
          const maxYear = Math.max(...allBirthYears);
          const yearRange = maxYear - minYear;
          secondaryValue =
            yearRange > 0
              ? ((individual.metadata.birthYear ?? minYear) - minYear) /
                yearRange
              : 0.5;
        }
        break;
      }
    }
  }

  // Get visual parameters directly from context
  const { variationFactor } = visual;
  const temp = temperature ?? 0.5;

  // Combine primary and secondary dimensions
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

  // Map the adjusted value to one of the available shapes
  const shapeIndex = Math.floor(adjustedDimensionValue * SHAPES.length);
  const clampedIndex = Math.min(shapeIndex, SHAPES.length - 1);

  return SHAPES[clampedIndex];
}

/**
 * Node shape transform function
 * Applies shape calculations to all individuals based on selected dimensions
 */
export async function nodeShapeTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata } = context;

  const individuals = Object.values(gedcomData.individuals);
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Apply shape calculations to each individual
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals[individual.id] ?? {};
    const calculatedShape = calculateNodeShape(context, individual.id);

    // Preserve existing visual metadata and update shape
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      shape: calculatedShape,
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