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
} from './types';

/**
 * Adjust color hue by a small amount
 */
function adjustColorHue(color: string, _variation: number): string {
  // Simple color adjustment - for now just return the original color
  // TODO: Implement proper HSL color manipulation
  return color;
}

/**
 * Calculate horizontal position based on selected dimensions and parameters
 */
function calculateHorizontalPosition(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, visualMetadata, dimensions, visual, temperature } =
    context;
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;

  // Find the individual
  const individual = gedcomData.individuals[individualId];

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'generation':
      primaryValue = individual.metadata.relativeGenerationValue ?? 0.5;
      break;
    case 'birthYear': {
      // Normalize birth year to 0-1 range
      const allBirthYears = Object.values(gedcomData.individuals)
        .map((ind) => ind.metadata.birthYear)
        .filter((year): year is number => year !== undefined);
      if (allBirthYears.length > 0) {
        const minYear = Math.min(...allBirthYears);
        const maxYear = Math.max(...allBirthYears);
        const year = individual.metadata.birthYear ?? minYear;
        primaryValue = (year - minYear) / (maxYear - minYear);
      }
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

  // Get visual parameters directly from context
  const { horizontalPadding, spacing, variationFactor } = visual;
  const temp = temperature ?? 0.5;

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
  const availableWidth = canvasWidth - (horizontalPadding as number) * 2;
  const generationStart = horizontalPadding as number;

  // Combine primary and secondary dimensions with variation factor
  const combinedValue = primaryValue * 0.7 + secondaryValue * 0.3;

  // Add temperature-based randomness with variation factor influence
  const baseRandomness = (Math.random() - 0.5) * temp * 0.2; // ±10% max variation
  const variationRandomness =
    (Math.random() - 0.5) * (variationFactor as number) * 0.1; // Additional variation
  const totalRandomFactor = baseRandomness + variationRandomness;

  const adjustedDimensionValue = Math.max(
    0,
    Math.min(1, combinedValue + totalRandomFactor),
  );

  // Position within generation based on combined dimension value
  const positionInGeneration =
    generationStart +
    adjustedDimensionValue * availableWidth * spacingMultiplier;

  return positionInGeneration;
}

/**
 * Calculate vertical position based on generation
 */
function calculateVerticalPosition(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, visualMetadata } = context;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;

  // Find the individual
  const individual = gedcomData.individuals[individualId];
  const generation = individual.metadata.generation ?? 0;

  // Calculate vertical spacing
  const individuals = Object.values(gedcomData.individuals);
  const maxGenerations = Math.max(
    ...individuals.map((ind) => ind.metadata.generation ?? 0),
  );
  const minGenerations = Math.min(
    ...individuals.map((ind) => ind.metadata.generation ?? 0),
  );
  const generationRange = maxGenerations - minGenerations;

  if (generationRange === 0) {
    return canvasHeight / 2; // All in same generation, center vertically
  }

  // Normalize generation to 0-1 range
  const normalizedGeneration = (generation - minGenerations) / generationRange;

  // Position vertically with some padding
  const verticalPadding = canvasHeight * 0.1;
  const availableHeight = canvasHeight - verticalPadding * 2;
  const y = verticalPadding + normalizedGeneration * availableHeight;

  return y;
}

/**
 * Horizontal spread by generation transform function
 * Positions all individuals based on their generation
 */
export async function horizontalSpreadByGenerationTransform(
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
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals[individual.id] ?? {};
    const x = calculateHorizontalPosition(context, individual.id);
    const y = calculateVerticalPosition(context, individual.id);

    // Get visual parameters directly from context
    const { nodeSize, primaryColor, variationFactor, temperature } =
      context.visual;
    const temp = (temperature as number) || 0.5;

    // Convert node size string to actual size with temperature-based variation
    const sizeMap = {
      small: 15,
      medium: 20,
      large: 30,
      'extra-large': 40,
    };
    const baseSize = sizeMap[nodeSize as keyof typeof sizeMap] || 20;

    // Add size variation based on temperature and variation factor
    const sizeVariation = (Math.random() - 0.5) * temp * 0.3; // ±15% size variation
    const variationSizeAdjustment =
      (Math.random() - 0.5) * (variationFactor as number) * 0.2;
    const finalSize = Math.max(
      5,
      baseSize * (1 + sizeVariation + variationSizeAdjustment),
    );

    // Add color variation based on temperature
    const colorVariation = temp > 0.3 ? (Math.random() - 0.5) * 0.1 : 0; // Subtle hue shift
    const baseColor = String(primaryColor);
    const adjustedColor =
      colorVariation !== 0
        ? adjustColorHue(baseColor, colorVariation)
        : baseColor;

    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      x,
      y,
      size: finalSize,
      color: adjustedColor,
      shape: visualMetadata.global.defaultNodeShape ?? 'circle',
      // Add opacity variation based on temperature
      opacity: Math.max(0.3, 1 - temp * 0.2), // Higher temp = slightly more transparent
    };
  });

  // Small delay to simulate async work (will be useful for future LLM calls)
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}
