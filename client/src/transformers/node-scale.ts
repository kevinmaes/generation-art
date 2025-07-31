/**
 * Node Scale Transformer
 *
 * This transformer controls the width and height scale of nodes based on metadata.
 * Unlike the node-size transformer which controls uniform size, this transformer
 * allows for different width/height ratios, creating oval or rectangular shapes.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
} from './types';
import { getIndividualOrWarn } from './utils/transformer-guards';

/**
 * Calculate node scale based on selected dimensions
 * Returns { width: number, height: number } scale factors
 */
function calculateNodeScale(
  context: TransformerContext,
  individualId: string,
): { width: number; height: number } {
  const { gedcomData, dimensions, visual, temperature } = context;

  // Find the individual with null check
  const individual = getIndividualOrWarn(
    gedcomData,
    individualId,
    'Node scale transformer',
  );
  if (!individual) {
    return { width: 1, height: 1 }; // Return default scale
  }

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
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
    case 'generation': {
      const generationValue =
        individual.metadata?.relativeGenerationValue ?? 0.5;
      primaryValue = generationValue;
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
    case 'nameLength': {
      const fullName = String(individual.name || '').trim();
      const allNameLengths = Object.values(gedcomData.individuals)
        .filter((ind) => ind !== null && ind !== undefined)
        .map((ind) => {
          return String(ind.name || '').trim().length;
        });
      const maxNameLength = Math.max(...allNameLengths);
      primaryValue = maxNameLength > 0 ? fullName.length / maxNameLength : 0.5;
      break;
    }
  }

  // Get the secondary dimension value (if specified)
  const secondaryDimension = dimensions.secondary;
  let secondaryValue = 0.5; // Default fallback

  if (secondaryDimension && secondaryDimension !== primaryDimension) {
    switch (secondaryDimension) {
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
      case 'generation': {
        const generationValue =
          individual.metadata?.relativeGenerationValue ?? 0.5;
        secondaryValue = generationValue;
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
      case 'nameLength': {
        const fullName = String(individual.name || '').trim();
        const allNameLengths = Object.values(gedcomData.individuals)
          .filter((ind) => ind !== null && ind !== undefined)
          .map((ind) => {
            return String(ind.name || '').trim().length;
          });
        const maxNameLength = Math.max(...allNameLengths);
        secondaryValue =
          maxNameLength > 0 ? fullName.length / maxNameLength : 0.5;
        break;
      }
    }
  }

  // Get visual parameters directly from context
  const { variationFactor } = visual;
  const temp = temperature ?? 0.5;

  // Add temperature-based randomness with variation factor influence
  const baseRandomness = (Math.random() - 0.5) * temp * 0.3; // ±15% max variation
  const variationRandomness =
    (Math.random() - 0.5) * (variationFactor as number) * 0.2; // Additional variation
  const totalRandomFactor = baseRandomness + variationRandomness;

  // Apply randomness to both dimensions
  const primaryRandomness = totalRandomFactor;
  const secondaryRandomness = (Math.random() - 0.5) * temp * 0.2; // Independent secondary randomness

  const adjustedPrimaryValue = Math.max(
    0,
    Math.min(1, primaryValue + primaryRandomness),
  );
  const adjustedSecondaryValue = Math.max(
    0,
    Math.min(1, secondaryValue + secondaryRandomness),
  );

  // Convert to scale factors
  // Scale range: 0.5 to 2.0 (can be half size to double size)
  const scaleRange = { min: 0.5, max: 2.0 };
  const scaleSpan = scaleRange.max - scaleRange.min;

  const widthScale = scaleRange.min + adjustedPrimaryValue * scaleSpan;
  const heightScale = scaleRange.min + adjustedSecondaryValue * scaleSpan;

  return {
    width: widthScale,
    height: heightScale,
  };
}

/**
 * Node scale transform function
 * Applies scale calculations to all individuals based on selected dimensions
 */
export async function nodeScaleTransform(
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

  // Apply scale calculations to each individual
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals?.[individual.id] ?? {};
    const calculatedScale = calculateNodeScale(context, individual.id);

    // Preserve existing visual metadata and update width/height
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      width: calculatedScale.width,
      height: calculatedScale.height,
      scale: Math.sqrt(calculatedScale.width * calculatedScale.height), // Overall scale factor
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
