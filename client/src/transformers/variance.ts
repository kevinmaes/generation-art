/**
 * Variance Transformer
 *
 * This transformer adds controlled randomness and variation to visual elements,
 * creating more organic and natural-looking visualizations.
 *
 * IMPORTANT: This transformer is non-deterministic by default. Each run will
 * produce different results unless a seed is provided in the context.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  VisualTransformerConfig,
} from './types';
import { createTransformerInstance } from './utils';

/**
 * Configuration for the variance transformer
 */
export const varianceConfig: VisualTransformerConfig = {
  id: 'variance',
  name: 'Variance',
  description:
    'Adds controlled randomness to visual properties, creating organic variation in size, position, rotation, and opacity across the visualization.',
  shortDescription: 'Adds natural variation to visual elements',
  transform: varianceTransform,
  categories: ['visual', 'style'],
  availableDimensions: ['generation', 'childrenCount', 'lifespan'],
  defaultPrimaryDimension: 'generation',
  visualParameters: [
    {
      name: 'varianceAmount',
      type: 'range',
      defaultValue: 25,
      label: 'Variance Amount',
      description:
        'Amount of variation (0% = uniform, 100% = maximum variation)',
      min: 0,
      max: 100,
      step: 5,
    },
    {
      name: 'varianceMode',
      type: 'select',
      defaultValue: 'uniform',
      label: 'Variance Mode',
      description: 'How variance is applied across the tree',
      options: [
        { value: 'uniform', label: 'Uniform - Same variance for all' },
        { value: 'graduated', label: 'Graduated - Varies by generation' },
        { value: 'random', label: 'Random - Different per node' },
        { value: 'clustered', label: 'Clustered - Similar within families' },
      ],
    },
    {
      name: 'varySize',
      type: 'boolean',
      defaultValue: true,
      label: 'Vary Size',
      description: 'Apply variance to node sizes',
    },
    {
      name: 'varyPosition',
      type: 'boolean',
      defaultValue: true,
      label: 'Vary Position',
      description: 'Apply variance to node positions',
    },
    {
      name: 'varyRotation',
      type: 'boolean',
      defaultValue: false,
      label: 'Vary Rotation',
      description: 'Apply variance to node rotation',
    },
    {
      name: 'varyOpacity',
      type: 'boolean',
      defaultValue: false,
      label: 'Vary Opacity',
      description: 'Apply variance to node opacity',
    },
    {
      name: 'limitToPreviousChanges',
      type: 'boolean',
      defaultValue: true,
      label: "Only affect previous transformer's changes",
      description:
        'When enabled, variance is applied only to properties modified by the immediately previous transformer',
    },
  ],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, varianceTransform, [
      { name: 'varianceAmount', defaultValue: 25 },
      { name: 'varianceMode', defaultValue: 'uniform' },
      { name: 'varySize', defaultValue: true },
      { name: 'varyPosition', defaultValue: true },
      { name: 'varyRotation', defaultValue: false },
      { name: 'varyOpacity', defaultValue: false },
      { name: 'limitToPreviousChanges', defaultValue: true },
    ]),
};

/**
 * Simple seeded random number generator for reproducible randomness
 */
function seededRandom(seed: string, index: number): number {
  const hash = seed.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, index);
  return ((hash * 9301 + 49297) % 233280) / 233280;
}

/**
 * Calculate variance factor based on mode and context
 */
function calculateVarianceFactor(
  mode: string,
  baseVariance: number,
  context: TransformerContext,
  individualId: string,
  familyId?: string,
): number {
  const { gedcomData, seed = 'default' } = context;
  const individual = gedcomData.individuals[individualId];
  if (!individual) return 0;

  switch (mode) {
    case 'uniform':
      // Same variance for all nodes
      return baseVariance / 100;

    case 'graduated': {
      // Variance changes by generation (older = more variance)
      const generation = individual.metadata?.relativeGenerationValue ?? 0.5;
      return (baseVariance / 100) * (1 - generation * 0.5);
    }

    case 'random': {
      // Different variance per node
      const randomFactor = seededRandom(seed, individualId.charCodeAt(0));
      return (baseVariance / 100) * randomFactor;
    }

    case 'clustered': {
      // Similar variance within families
      const familySeed = familyId || individual.parents?.[0] || individualId;
      const familyRandom = seededRandom(seed, familySeed.charCodeAt(0));
      const individualRandom = seededRandom(seed, individualId.charCodeAt(0));
      // 70% family influence, 30% individual variation
      return (
        (baseVariance / 100) * (familyRandom * 0.7 + individualRandom * 0.3)
      );
    }

    default:
      return baseVariance / 100;
  }
}

/**
 * Apply variance to a numeric value
 */
function applyVariance(
  value: number,
  varianceFactor: number,
  seed: string,
  index: number,
): number {
  const random = seededRandom(seed, index);
  // Convert 0-1 random to -1 to 1
  const randomOffset = (random - 0.5) * 2;
  return value + value * varianceFactor * randomOffset;
}

/**
 * Variance transform function
 * Applies controlled randomness to visual properties
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function varianceTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata, visual } = context;

  // Determine whether we should limit to previous transformer's changes
  const hasPrevious = Boolean(context.previousChangeSet);
  const limitToPrevious = ((): boolean => {
    const provided = visual?.limitToPreviousChanges as boolean | undefined;
    if (provided !== undefined) return Boolean(provided);
    // Default to true only when running in a pipeline and we have a previous change set
    return hasPrevious;
  })();

  // Generate a unique seed for each run using timestamp and random value
  const seed =
    context.seed || `${Date.now().toString()}-${Math.random().toString()}`;

  // Get visual parameters
  const varianceAmount = Number(visual?.varianceAmount ?? 25);
  const varianceMode = String(visual?.varianceMode ?? 'uniform');
  const varySize = Boolean(visual?.varySize ?? true);
  const varyPosition = Boolean(visual?.varyPosition ?? true);
  const varyRotation = Boolean(visual?.varyRotation ?? false);
  const varyOpacity = Boolean(visual?.varyOpacity ?? false);

  // If variance is 0, no transformation needed
  if (varianceAmount === 0) {
    return { visualMetadata: {} };
  }

  const individuals = Object.values(gedcomData.individuals).filter(
    (individual) => individual !== null && individual !== undefined,
  );
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Helpers to check whether a property is allowed by previous change set
  const wasChanged = (
    entityType: 'individuals' | 'edges' | 'families' | 'tree',
    id: string | undefined,
    prop: keyof VisualMetadata,
  ): boolean => {
    if (!limitToPrevious || !context.previousChangeSet) return true;
    const cs = context.previousChangeSet;
    if (entityType === 'tree') {
      return cs.tree ? cs.tree.includes(prop) : false;
    }
    const map = (cs as Record<string, unknown>)[entityType] as
      | Record<string, (keyof VisualMetadata)[]>
      | undefined;
    if (!map || !id) return false;
    const props = map[id];
    return Array.isArray(props) ? props.includes(prop) : false;
  };

  // Create updated visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};
  const updatedEdges: Record<string, VisualMetadata> = {};

  // Apply variance to individuals
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals?.[individual.id] ?? {};

    // Find family ID for clustered mode
    const familyId = Object.values(gedcomData.families).find(
      (family) =>
        family?.husband?.id === individual.id ||
        family?.wife?.id === individual.id ||
        family?.children?.some((child) => child.id === individual.id),
    )?.id;

    // Calculate variance factor for this individual
    const varianceFactor = calculateVarianceFactor(
      varianceMode,
      varianceAmount,
      context,
      individual.id,
      familyId,
    );

    // Start with existing metadata
    const newMetadata: VisualMetadata = { ...currentMetadata };

    // Apply variance to size
    if (
      varySize &&
      currentMetadata.size !== undefined &&
      wasChanged('individuals', individual.id, 'size')
    ) {
      newMetadata.size = applyVariance(
        currentMetadata.size,
        varianceFactor,
        seed,
        individual.id.charCodeAt(0) + 1,
      );
      // Ensure size stays positive
      newMetadata.size = Math.max(5, newMetadata.size);
    }

    // Apply variance to position
    if (varyPosition) {
      if (
        currentMetadata.x !== undefined &&
        wasChanged('individuals', individual.id, 'x')
      ) {
        // Position variance is limited to prevent overlaps
        const positionVariance = varianceFactor * 0.3; // 30% of normal variance
        newMetadata.x = applyVariance(
          currentMetadata.x,
          positionVariance,
          seed,
          individual.id.charCodeAt(0) + 2,
        );
      }
      if (
        currentMetadata.y !== undefined &&
        wasChanged('individuals', individual.id, 'y')
      ) {
        const positionVariance = varianceFactor * 0.3;
        newMetadata.y = applyVariance(
          currentMetadata.y,
          positionVariance,
          seed,
          individual.id.charCodeAt(0) + 3,
        );
      }
    }

    // Apply variance to rotation
    if (varyRotation && wasChanged('individuals', individual.id, 'rotation')) {
      const baseRotation = currentMetadata.rotation ?? 0;
      // Rotation variance is applied as absolute degrees, not relative
      const maxRotationVariance = varianceFactor * 45; // Max 45 degrees at 100% variance
      const random = seededRandom(seed, individual.id.charCodeAt(0) + 4);
      // Convert 0-1 random to -1 to 1
      const randomOffset = (random - 0.5) * 2;
      newMetadata.rotation = baseRotation + maxRotationVariance * randomOffset;
    }

    // Apply variance to opacity
    if (
      varyOpacity &&
      currentMetadata.opacity !== undefined &&
      wasChanged('individuals', individual.id, 'opacity')
    ) {
      newMetadata.opacity = applyVariance(
        currentMetadata.opacity,
        varianceFactor * 0.5, // Limit opacity variance
        seed,
        individual.id.charCodeAt(0) + 5,
      );
      // Clamp opacity between 0.1 and 1
      newMetadata.opacity = Math.max(0.1, Math.min(1, newMetadata.opacity));
    }

    updatedIndividuals[individual.id] = newMetadata;
  });

  // Apply subtle variance to edge curves if position is varied
  if (varyPosition && visualMetadata.edges) {
    Object.entries(visualMetadata.edges).forEach(([edgeId, edgeMetadata]) => {
      if (
        edgeMetadata.curveIntensity !== undefined &&
        wasChanged('edges', edgeId, 'curveIntensity')
      ) {
        const edgeVarianceFactor = (varianceAmount / 100) * 0.2; // Subtle edge variance
        const newIntensity = applyVariance(
          edgeMetadata.curveIntensity,
          edgeVarianceFactor,
          seed,
          edgeId.charCodeAt(0),
        );
        updatedEdges[edgeId] = {
          ...edgeMetadata,
          curveIntensity: Math.max(0, Math.min(1, newIntensity)),
        };
      }
    });
  }

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
      ...(Object.keys(updatedEdges).length > 0 && { edges: updatedEdges }),
    },
  };
}
