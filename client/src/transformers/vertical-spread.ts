/**
 * Vertical Spread Transformer
 *
 * This transformer positions individuals vertically based on their generation
 * and selected dimensions, creating visual separation within generations.
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
 * Configuration for the vertical spread transformer
 */
export const verticalSpreadConfig: VisualTransformerConfig = {
  id: 'vertical-spread',
  name: 'Vertical Spread',
  description:
    'Employs sophisticated vertical positioning algorithms to create meaningful visual separations and hierarchies within family structures.',
  shortDescription: 'Spreads nodes vertically by birth year or children',
  transform: verticalSpreadTransform,
  categories: ['layout', 'positioning'],
  availableDimensions: [
    'birthYear',
    'childrenCount',
    'lifespan',
    'generation',
    'nameLength',
  ],
  defaultPrimaryDimension: 'birthYear',
  defaultSecondaryDimension: 'childrenCount',
  visualParameters: [
    {
      name: 'verticalPadding',
      type: 'range',
      defaultValue: 60,
      label: 'Vertical Padding',
      description: 'Padding from top and bottom of canvas',
      min: 10,
      max: 200,
      step: 5,
    },
    {
      name: 'nodeSize',
      type: 'select',
      defaultValue: 'medium',
      label: 'Node Size',
      description: 'Size of individual nodes',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'extra-large', label: 'Extra Large' },
      ],
    },
    {
      name: 'primaryColor',
      type: 'color',
      defaultValue: '#7B68EE',
      label: 'Primary Color',
      description: 'Main color for nodes',
    },
    {
      name: 'spacing',
      type: 'select',
      defaultValue: 'normal',
      label: 'Spacing',
      description: 'General spacing between elements',
      options: [
        { value: 'tight', label: 'Tight' },
        { value: 'compact', label: 'Compact' },
        { value: 'normal', label: 'Normal' },
        { value: 'loose', label: 'Loose' },
        { value: 'sparse', label: 'Sparse' },
      ],
    },
  ],
  getDefaults: () => ({
    verticalPadding: 60,
    nodeSize: 'medium',
    primaryColor: '#7B68EE',
    spacing: 'normal',
  }),
  createTransformerInstance: (params) =>
    createTransformerInstance(params, verticalSpreadTransform, [
      { name: 'verticalPadding', defaultValue: 60 },
      { name: 'nodeSize', defaultValue: 'medium' },
      { name: 'primaryColor', defaultValue: '#7B68EE' },
      { name: 'spacing', defaultValue: 'normal' },
    ]),
};

/**
 * Calculate vertical position based on selected dimensions and parameters
 */
function calculateVerticalPosition(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, visualMetadata, dimensions, visual } = context;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;

  // Find the individual with null check
  const individual = getIndividualOrWarn(
    gedcomData,
    individualId,
    'Vertical spread transformer',
  );
  if (!individual) {
    return canvasHeight / 2; // Return center position
  }

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let primaryValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'generation':
      primaryValue = individual.metadata?.relativeGenerationValue ?? 0.5;
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

  // Get visual parameters directly from context
  const { verticalPadding, spacing } = visual;

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

  // Calculate available height
  const availableHeight = canvasHeight - (verticalPadding as number) * 2;
  const generationStart = verticalPadding as number;

  // Combine primary and secondary dimensions (deterministic)
  const combinedValue = primaryValue * 0.7 + secondaryValue * 0.3;

  // Position within generation based on combined dimension value (no randomness)
  const positionInGeneration =
    generationStart + combinedValue * availableHeight * spacingMultiplier;

  return positionInGeneration;
}

/**
 * Vertical spread transform function
 * Positions all individuals based on their generation and selected dimensions
 */
export async function verticalSpreadTransform(
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
    // Don't calculate x - preserve existing x position from previous transformers
    const y = calculateVerticalPosition(context, individual.id);

    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      y, // Only set y position (vertical spread responsibility)
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
