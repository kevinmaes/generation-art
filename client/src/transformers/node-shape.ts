/**
 * Node Shape Transformer
 *
 * This transformer controls the shape of nodes based on metadata like
 * generation, gender, marriage status, or number of children.
 *
 * Determinism & reproducibility:
 * - Uses `context.seed` combined with `individual.id` to derive a stable numeric seed.
 * - Emits a `shapeProfile` so the renderer can generate geometry deterministically.
 *
 * Why `shapeProfile`:
 * - More flexible than legacy shape strings; supports complex, organic silhouettes.
 * - Cacheable by profile; same inputs produce the same geometry for performance.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  VisualTransformerConfig,
} from './types';
import { getIndividualSafe } from './utils/safe-access';
import { createTransformerInstance } from './utils';
import type { ShapeProfile } from '../../../shared/types';

// Deterministic small hash to derive numeric seeds from strings
function hashStringToInt(input: string): number {
  let h = 2166136261 >>> 0; // FNV-1a basis
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Configuration for the node shape transformer
 */
export const nodeShapeConfig: VisualTransformerConfig = {
  id: 'node-shape',
  name: 'Node Shape',
  description: 'Assigns shapes to nodes based on a selected dimension.',
  shortDescription: 'Shapes by dimension',
  transform: nodeShapeTransform,
  categories: ['visual'],
  availableDimensions: ['generation', 'childrenCount', 'lifespan'],
  defaultPrimaryDimension: 'generation',
  visualParameters: [],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, nodeShapeTransform, []),
  multiInstance: false,
};

/**
 * Available node shapes
 */
const SHAPES = ['circle', 'square', 'triangle', 'hexagon', 'star'] as const;
type NodeShape = (typeof SHAPES)[number];

function calculateNodeShape(
  context: TransformerContext,
  individualId: string,
): NodeShape {
  const { gedcomData, dimensions } = context;

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

  // Combine primary and secondary dimensions (ensure no NaN values)
  const safePrimaryValue = isNaN(primaryValue) ? 0.5 : primaryValue;
  const safeSecondaryValue = isNaN(secondaryValue) ? 0.5 : secondaryValue;
  const combinedValue = safePrimaryValue * 0.7 + safeSecondaryValue * 0.3;

  // Map the combined value to one of the available shapes (deterministic)
  const shapeIndex = Math.floor(combinedValue * SHAPES.length);
  const clampedIndex = Math.min(shapeIndex, SHAPES.length - 1);
  const selectedShape = SHAPES[clampedIndex];

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

    // Map calculated shape choice to a geometry profile (v0: circle or blob)
    const nodeSize =
      (currentMetadata.size ?? 20) * (currentMetadata.width ?? 1.0);
    const nodeHeight =
      (currentMetadata.size ?? 20) * (currentMetadata.height ?? 1.0);

    const isCircle = calculatedShape === 'circle';
    const baseProfile: ShapeProfile = {
      kind: isCircle ? 'circle' : 'blob',
      size: { width: nodeSize, height: nodeHeight },
      seed: hashStringToInt(
        `${String(context.seed ?? 'default')}::${individual.id}`,
      ),
      detail: { maxVertices: 192 },
      params: isCircle
        ? undefined
        : {
            noiseAmp: 0.18,
            noiseFreq: 2.0,
            octaves: 3,
            smooth: 0.5,
          },
    };

    // Preserve existing visual metadata and update shape
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      shape: calculatedShape,
      shapeProfile: baseProfile,
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
