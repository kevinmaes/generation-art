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
  NodeVisualMetadata,
  VisualTransformerConfig,
} from '../types';
import type { AugmentedIndividual } from '../../../../shared/types';
import { getIndividualOrWarn } from '../utils/transformer-guards';
import { createTransformerInstance } from '../utils';

/**
 * Configuration for the node scale transformer
 */
export const nodeScaleConfig: VisualTransformerConfig = {
  id: 'node-scale',
  name: 'Node Scale',
  description: 'Scales nodes uniformly based on a factor from a dimension.',
  shortDescription: 'Scale by dimension',
  transform: nodeScaleTransform,
  categories: ['visual'],
  availableDimensions: ['generation', 'lifespan'],
  defaultPrimaryDimension: 'generation',
  visualParameters: [],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, nodeScaleTransform, []),
  multiInstance: false,
};

/**
 * Calculate node scale based on selected dimensions
 * Returns { width: number, height: number } scale factors
 */
function calculateNodeScale(
  context: TransformerContext,
  individualId: string,
): { width: number; height: number } {
  const { gedcomData, dimensions } = context;

  // Find the individual with null check
  const individual = getIndividualOrWarn(
    gedcomData,
    individualId,
    'Node scale transformer',
  ) as AugmentedIndividual | null;
  if (!individual) {
    return { width: 1, height: 1 }; // Return default scale
  }

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  // Early validation to ensure we have valid dimensions
  if (!primaryDimension) {
    console.warn(
      `Node scale transformer: No primary dimension specified for individual ${individualId}`,
    );
    return { width: 1, height: 1 };
  }

  switch (primaryDimension) {
    case 'lifespan': {
      const allLifespans = Object.values(gedcomData.individuals)
        .filter((ind) => ind !== null && ind !== undefined)
        .map((ind) => ind.metadata?.lifespan)
        .filter((span): span is number => span !== undefined);
      if (allLifespans.length > 0) {
        const maxLifespan =
          allLifespans.length > 0 ? Math.max(...allLifespans) : 1;
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
        (individual): individual is AugmentedIndividual =>
          individual !== null && individual !== undefined,
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
      const maxMarriages =
        allMarriageCounts.length > 0 ? Math.max(...allMarriageCounts) : 0;
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
      const maxNameLength =
        allNameLengths.length > 0 ? Math.max(...allNameLengths) : 1;
      primaryValue = maxNameLength > 0 ? fullName.length / maxNameLength : 0.5;
      break;
    }
    default:
      console.warn(
        `Node scale transformer: Unknown primary dimension '${primaryDimension}' for individual ${individualId}, using default`,
      );
      primaryValue = 0.5;
      break;
  }

  // Validate primary value
  if (!Number.isFinite(primaryValue) || primaryValue < 0 || primaryValue > 1) {
    console.warn(
      `Node scale transformer: Invalid primary value ${String(primaryValue)} for individual ${individualId} using dimension ${primaryDimension}, using default`,
    );
    primaryValue = 0.5;
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
          const maxLifespan =
            allLifespans.length > 0 ? Math.max(...allLifespans) : 1;
          secondaryValue =
            maxLifespan > 0
              ? (individual.metadata?.lifespan ?? 0) / maxLifespan
              : 0.5;
        }
        break;
      }
      case 'childrenCount': {
        const allIndividuals = Object.values(gedcomData.individuals).filter(
          (individual): individual is AugmentedIndividual =>
            individual !== null && individual !== undefined,
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
        const maxMarriages =
          allMarriageCounts.length > 0 ? Math.max(...allMarriageCounts) : 0;
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
        const maxNameLength =
          allNameLengths.length > 0 ? Math.max(...allNameLengths) : 1;
        secondaryValue =
          maxNameLength > 0 ? fullName.length / maxNameLength : 0.5;
        break;
      }
      default:
        console.warn(
          `Node scale transformer: Unknown secondary dimension '${secondaryDimension}' for individual ${individualId}, using default`,
        );
        secondaryValue = 0.5;
        break;
    }
  }

  // Validate secondary value
  if (
    !Number.isFinite(secondaryValue) ||
    secondaryValue < 0 ||
    secondaryValue > 1
  ) {
    console.warn(
      `Node scale transformer: Invalid secondary value ${String(secondaryValue)} for individual ${individualId} using dimension ${secondaryDimension || 'none'}, using default`,
    );
    secondaryValue = 0.5;
  }

  // Convert to scale factors (deterministic)
  // Scale range: 0.5 to 2.0 (can be half size to double size)
  const scaleRange = { min: 0.5, max: 2.0 };
  const scaleSpan = scaleRange.max - scaleRange.min;

  const widthScale = scaleRange.min + primaryValue * scaleSpan;
  const heightScale = scaleRange.min + secondaryValue * scaleSpan;

  // Safety check to ensure we never return NaN or invalid values
  const safeWidth = Number.isFinite(widthScale) ? widthScale : 1;
  const safeHeight = Number.isFinite(heightScale) ? heightScale : 1;

  if (!Number.isFinite(widthScale) || !Number.isFinite(heightScale)) {
    console.warn(
      `Node scale transformer: Invalid scale values for individual ${individualId}, using defaults`,
    );
  }

  return {
    width: safeWidth,
    height: safeHeight,
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
    (individual): individual is AugmentedIndividual =>
      individual !== null && individual !== undefined,
  );
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, NodeVisualMetadata> = {};

  // Apply scale calculations to each individual
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals?.[individual.id] ?? {};
    const calculatedScale = calculateNodeScale(context, individual.id);

    // Calculate overall scale factor with safety check
    const overallScale = Math.sqrt(
      calculatedScale.width * calculatedScale.height,
    );
    const safeOverallScale = Number.isFinite(overallScale) ? overallScale : 1;

    // Preserve existing visual metadata and update width/height
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      width: calculatedScale.width,
      height: calculatedScale.height,
      scale: safeOverallScale, // Overall scale factor
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
