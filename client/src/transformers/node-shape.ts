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
import { getIndividualSafe } from './utils/safe-access';

/**
 * Available node shapes
 */
const SHAPES = ['circle', 'square', 'triangle', 'hexagon', 'star'] as const;
type NodeShape = (typeof SHAPES)[number];

/**
 * Calculate node shape based on selected dimensions
 */
let debugCallCount = 0;

function calculateNodeShape(
  context: TransformerContext,
  individualId: string,
): NodeShape {
  const { gedcomData, dimensions, visual, temperature } = context;

  // Only log first 3 calls to avoid spam
  if (debugCallCount < 3) {
    console.log(`🔍 calculateNodeShape called for ${individualId}:`, {
      primaryDimension: dimensions.primary,
      secondaryDimension: dimensions.secondary,
      visual: Object.keys(visual),
      temperature,
    });
    debugCallCount++;
  }

  // Find the individual
  const individual = getIndividualSafe(gedcomData, individualId);
  if (!individual) {
    console.warn(
      `Node shape transformer: Individual ${individualId} not found`,
    );
    return 'circle'; // Return default shape
  }

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'generation': {
      const generationValue =
        individual.metadata?.relativeGenerationValue ?? 0.5;
      primaryValue = generationValue;
      break;
    }
    case 'childrenCount': {
      // Count children by looking at parent relationships
      const allIndividuals = Object.values(gedcomData.individuals).filter(
        (ind) => ind !== null && ind !== undefined,
      );
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
    case 'marriageCount': {
      // Count marriages by checking families where individual is spouse
      const families = Object.values(gedcomData.families).filter(
        (family) => family !== null && family !== undefined,
      );
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
    case 'birthYear': {
      const allBirthYears = Object.values(gedcomData.individuals)
        .filter((ind) => ind !== null && ind !== undefined)
        .map((ind) => ind.metadata?.birthYear)
        .filter((year): year is number => year !== undefined);
      if (allBirthYears.length > 0) {
        const minYear = Math.min(...allBirthYears);
        const maxYear = Math.max(...allBirthYears);
        const yearRange = maxYear - minYear;
        primaryValue =
          yearRange > 0
            ? ((individual.metadata?.birthYear ?? minYear) - minYear) /
              yearRange
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
          individual.metadata?.relativeGenerationValue ?? 0.5;
        secondaryValue = generationValue;
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
      case 'marriageCount': {
        const families = Object.values(gedcomData.families).filter(
          (family) => family !== null && family !== undefined,
        );
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
      case 'birthYear': {
        const allBirthYears = Object.values(gedcomData.individuals)
          .filter((ind) => ind !== null && ind !== undefined)
          .map((ind) => ind.metadata?.birthYear)
          .filter((year): year is number => year !== undefined);
        if (allBirthYears.length > 0) {
          const minYear = Math.min(...allBirthYears);
          const maxYear = Math.max(...allBirthYears);
          const yearRange = maxYear - minYear;
          secondaryValue =
            yearRange > 0
              ? ((individual.metadata?.birthYear ?? minYear) - minYear) /
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

  // Combine primary and secondary dimensions (ensure no NaN values)
  const safePrimaryValue = isNaN(primaryValue) ? 0.5 : primaryValue;
  const safeSecondaryValue = isNaN(secondaryValue) ? 0.5 : secondaryValue;
  const combinedValue = safePrimaryValue * 0.7 + safeSecondaryValue * 0.3;

  // Add temperature-based randomness with variation factor influence (ensure no NaN)
  const baseRandomness = (Math.random() - 0.5) * temp * 0.3; // ±15% max variation
  const safeVariationFactor =
    typeof variationFactor === 'number' && !isNaN(variationFactor)
      ? variationFactor
      : 0.5;
  const variationRandomness = (Math.random() - 0.5) * safeVariationFactor * 0.2; // Additional variation
  const totalRandomFactor = baseRandomness + variationRandomness;

  const adjustedDimensionValue = Math.max(
    0,
    Math.min(1, combinedValue + totalRandomFactor),
  );

  // Map the adjusted value to one of the available shapes
  const shapeIndex = Math.floor(adjustedDimensionValue * SHAPES.length);
  const clampedIndex = Math.min(shapeIndex, SHAPES.length - 1);
  const selectedShape = SHAPES[clampedIndex];

  // Only log first 3 calculations
  if (debugCallCount <= 3) {
    console.log(
      `🔍 ${individualId} shape calculation: primaryValue=${String(primaryValue.toFixed(3))}, secondaryValue=${String(secondaryValue.toFixed(3))}, combinedValue=${String(combinedValue.toFixed(3))}, variationFactor=${String(safeVariationFactor)}, totalRandomFactor=${String(totalRandomFactor.toFixed(3))}, adjustedValue=${String(adjustedDimensionValue.toFixed(3))}, shapeIndex=${String(shapeIndex)}, selectedShape=${selectedShape}`,
    );
  }

  return selectedShape;
}

/**
 * Node shape transform function
 * Applies shape calculations to all individuals based on selected dimensions
 */
export async function nodeShapeTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata } = context;

  console.log('🔍 nodeShapeTransform called with context:', {
    individualCount: Object.keys(gedcomData.individuals).length,
    dimensions: context.dimensions,
    visual: Object.keys(context.visual),
  });

  const individuals = Object.values(gedcomData.individuals).filter(
    (individual) => individual !== null && individual !== undefined,
  );
  if (individuals.length === 0) {
    console.log('🔍 No individuals found, returning empty metadata');
    return { visualMetadata: {} };
  }

  console.log(`🔍 Processing ${String(individuals.length)} individuals`);

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Apply shape calculations to each individual
  individuals.forEach((individual, index) => {
    const currentMetadata = visualMetadata.individuals?.[individual.id] ?? {};
    const calculatedShape = calculateNodeShape(context, individual.id);

    // Only log first 3 for debugging
    if (index < 3) {
      console.log(
        `🔍 Individual ${individual.id}: calculated shape = ${String(calculatedShape)}`,
      );
    }

    // Preserve existing visual metadata and update shape
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      shape: calculatedShape,
    };
  });

  // Small delay to simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1));

  // Simple verification that shapes are being set
  const shapeCounts = Object.values(updatedIndividuals).reduce<
    Record<string, number>
  >((acc, individual) => {
    const shape = individual.shape || 'undefined';
    acc[shape] = (acc[shape] || 0) + 1;
    return acc;
  }, {});

  console.log('🔍 Node shape transformer output summary:', shapeCounts);

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}
