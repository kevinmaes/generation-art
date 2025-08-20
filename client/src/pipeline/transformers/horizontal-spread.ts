/**
 * Horizontal Spread by Generation Transformer
 *
 * This transformer positions individuals horizontally based on their generation,
 * creating a traditional family tree layout where each generation is on a row.
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
 * Configuration for the horizontal spread transformer
 */
export const horizontalSpreadConfig: VisualTransformerConfig = {
  id: 'horizontal-spread',
  name: 'Horizontal Spread',
  description:
    'Distributes individuals horizontally based on generation to create a balanced layout.',
  shortDescription: 'Spread nodes horizontally by generation',
  transform: horizontalSpreadTransform,
  categories: ['layout', 'positioning'],
  availableDimensions: ['generation'],
  defaultPrimaryDimension: 'generation',
  visualParameters: [],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, horizontalSpreadTransform, []),
  multiInstance: false,
};

/**
 * Calculate horizontal position based on selected dimensions and parameters
 */
function calculateHorizontalPosition(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, visualMetadata, dimensions, visual } = context;
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;

  // Find the individual with null check
  const individual = getIndividualOrWarn(
    gedcomData,
    individualId,
    'Horizontal spread transformer',
  );
  if (!individual) {
    return canvasWidth / 2; // Return center position
  }

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'generation':
      primaryValue = individual.metadata?.relativeGenerationValue ?? 0.5;
      // Debug logging for missing metadata
      if (individual.metadata?.relativeGenerationValue === undefined) {
        console.warn(
          `Missing relativeGenerationValue for ${String(individual.id)}, using default 0.5`,
        );
      }
      break;
    case 'birthYear': {
      // Normalize birth year to 0-1 range
      const allBirthYears = Object.values(gedcomData.individuals)
        .filter((ind) => ind !== null && ind !== undefined)
        .map((ind) => ind.metadata?.birthYear)
        .filter((year): year is number => year !== undefined);
      if (allBirthYears.length > 0) {
        const minYear = Math.min(...allBirthYears);
        const maxYear = Math.max(...allBirthYears);
        const year = individual.metadata?.birthYear ?? minYear;
        primaryValue = (year - minYear) / (maxYear - minYear);
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
    case 'nameLength': {
      const allNameLengths = Object.values(gedcomData.individuals).map(
        (ind) => ind.name.length,
      );
      const maxNameLength = Math.max(...allNameLengths);
      primaryValue =
        maxNameLength > 0 ? individual.name.length / maxNameLength : 0.5;
      break;
    }
  }

  // Get the secondary dimension value (if specified)
  const secondaryDimension = dimensions.secondary;
  let secondaryValue = 0.5; // Default fallback

  if (secondaryDimension && secondaryDimension !== primaryDimension) {
    switch (secondaryDimension) {
      case 'generation':
        secondaryValue = individual.metadata.relativeGenerationValue ?? 0.5;
        break;
      case 'birthYear': {
        const allBirthYears = Object.values(gedcomData.individuals)
          .map((ind) => ind.metadata.birthYear)
          .filter((year): year is number => year !== undefined);
        if (allBirthYears.length > 0) {
          const minYear = Math.min(...allBirthYears);
          const maxYear = Math.max(...allBirthYears);
          const year = individual.metadata.birthYear ?? minYear;
          secondaryValue = (year - minYear) / (maxYear - minYear);
        }
        break;
      }
      case 'childrenCount': {
        const allIndividuals = Object.values(gedcomData.individuals).filter(
          (ind) => ind !== null && ind !== undefined,
        );
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
      case 'nameLength': {
        const allNameLengths = Object.values(gedcomData.individuals).map(
          (ind) => ind.name.length,
        );
        const maxNameLength = Math.max(...allNameLengths);
        secondaryValue =
          maxNameLength > 0 ? individual.name.length / maxNameLength : 0.5;
        break;
      }
    }
  }

  // Get visual parameters directly from context with defaults
  const horizontalPadding =
    typeof visual?.horizontalPadding === 'number'
      ? visual.horizontalPadding
      : 50;
  const spacing =
    typeof visual?.spacing === 'string' ? visual.spacing : 'normal';

  // Calculate spacing multiplier based on spacing setting
  const spacingMultipliers = {
    tight: 0.6,
    compact: 0.8,
    normal: 1.0,
    loose: 1.2,
    sparse: 1.5,
  };
  const spacingMultiplier =
    spacingMultipliers[spacing as keyof typeof spacingMultipliers] || 1.0;

  // Calculate available width
  const availableWidth = canvasWidth - horizontalPadding * 2;
  const generationStart = horizontalPadding;

  // Combine primary and secondary dimensions (deterministic)
  const combinedValue = primaryValue * 0.7 + secondaryValue * 0.3;

  // Debug check for NaN values
  if (isNaN(primaryValue) || isNaN(secondaryValue) || isNaN(combinedValue)) {
    console.error(`NaN detected for ${individualId}:`, {
      primaryValue,
      secondaryValue,
      combinedValue,
      primaryDimension,
      secondaryDimension,
      horizontalPadding,
      spacing,
      canvasWidth,
    });
    return canvasWidth / 2; // Return center as fallback
  }

  // Position within generation based on combined dimension value (no randomness)
  const positionInGeneration =
    generationStart + combinedValue * availableWidth * spacingMultiplier;

  return positionInGeneration;
}

/**
 * Horizontal spread by generation transform function
 * Positions all individuals based on their generation
 */
export async function horizontalSpreadTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata } = context;

  const individuals = Object.values(gedcomData.individuals);
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Position each individual based on their generation
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;

  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals[individual.id] ?? {};
    let x = calculateHorizontalPosition(context, individual.id);

    // Ensure x is always a valid number
    if (x === undefined || x === null || isNaN(x)) {
      console.warn(`Invalid x position for ${individual.id}, using center`);
      x = canvasWidth / 2;
    }

    // Always provide both x and y coordinates
    // Use existing y if available, otherwise position based on generation
    let y = currentMetadata.y;
    if (y === undefined || y === null || isNaN(y)) {
      // Calculate y based on generation with some vertical spacing
      const generation = individual.metadata?.generation ?? 0;
      const maxGeneration = Math.max(
        ...individuals.map((ind) => ind.metadata?.generation ?? 0),
      );
      const verticalSpacing = canvasHeight / (maxGeneration + 2);
      y = verticalSpacing * (generation + 1);
    }

    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      x, // Always provide a valid x coordinate
      y, // Always provide a valid y coordinate
    };
  });

  // Create edge visual metadata
  const updatedEdges: Record<string, VisualMetadata> = {};

  gedcomData.metadata.edges.forEach((edge) => {
    const currentEdgeMetadata = visualMetadata.edges[edge.id] ?? {};

    // Set basic edge visual properties
    const strokeWeight = edge.relationshipType === 'spouse' ? 3 : 1.5;
    const strokeColor =
      edge.relationshipType === 'spouse' ? '#4A5568' : '#718096';

    updatedEdges[edge.id] = {
      ...currentEdgeMetadata,
      strokeWeight,
      strokeColor,
      opacity: 0.6,
      // Note: We don't set x/y for edges as those aren't used for rendering
      // The actual edge positions are determined by the node positions
    };
  });

  // Small delay to simulate async work (will be useful for future LLM calls)
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
      edges: updatedEdges,
    },
  };
}
