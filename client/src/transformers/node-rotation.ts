/**
 * Node Rotation Transformer
 *
 * This transformer controls the rotation of nodes based on metadata like
 * birth year, generation, lifespan, or number of children.
 * Rotation values are in radians (0 to 2π).
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  VisualTransformerConfig,
} from './types';
import { getIndividualOrWarn } from './utils/transformer-guards';
import { createTransformerInstance } from './utils';

/**
 * Configuration for the node rotation transformer
 */
export const nodeRotationConfig: VisualTransformerConfig = {
  id: 'node-rotation',
  name: 'Node Rotation',
  description: 'Rotates nodes based on a selected dimension.',
  shortDescription: 'Rotation by dimension',
  transform: nodeRotationTransform,
  categories: ['visual'],
  availableDimensions: ['generation', 'lifespan'],
  defaultPrimaryDimension: 'generation',
  visualParameters: [],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, nodeRotationTransform, []),
  multiInstance: false,
};

/**
 * Calculate node rotation based on selected dimensions
 */
function calculateNodeRotation(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, dimensions } = context;

  // Find the individual with null check
  const individual = getIndividualOrWarn(
    gedcomData,
    individualId,
    'Node rotation transformer',
  );
  if (!individual) {
    return 0; // Return default rotation
  }

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
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
    case 'generation': {
      const generationValue =
        individual.metadata?.relativeGenerationValue ?? 0.5;
      primaryValue = generationValue;
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
      const maxChildren =
        childrenCounts.length > 0 ? Math.max(...childrenCounts) : 0;
      const individualChildren = allIndividuals.filter((child) =>
        child?.parents?.includes(individual.id),
      ).length;
      primaryValue = maxChildren > 0 ? individualChildren / maxChildren : 0.5;
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
  }

  // Get the secondary dimension value (if specified)
  const secondaryDimension = dimensions.secondary;
  let secondaryValue = 0.5; // Default fallback

  if (secondaryDimension && secondaryDimension !== primaryDimension) {
    switch (secondaryDimension) {
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
      case 'generation': {
        const generationValue =
          individual.metadata?.relativeGenerationValue ?? 0.5;
        secondaryValue = generationValue;
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
    }
  }

  // Combine primary and secondary dimensions (deterministic)
  const combinedValue = primaryValue * 0.7 + secondaryValue * 0.3;

  // Convert to rotation in radians (0 to 2π) - no randomness
  const rotationRadians = combinedValue * 2 * Math.PI;

  // Safety check to ensure we never return NaN or invalid values
  if (!Number.isFinite(rotationRadians)) {
    console.warn(
      `Node rotation transformer: Invalid rotation value for individual ${individualId}, defaulting to 0`,
    );
    return 0;
  }

  return rotationRadians;
}

/**
 * Node rotation transform function
 * Applies rotation calculations to all individuals based on selected dimensions
 */
export async function nodeRotationTransform(
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

  // Apply rotation calculations to each individual
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals?.[individual.id] ?? {};
    const calculatedRotation = calculateNodeRotation(context, individual.id);

    // Preserve existing visual metadata and update rotation
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      rotation: calculatedRotation,
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
