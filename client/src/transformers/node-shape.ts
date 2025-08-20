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
  availableDimensions: [
    'generation',
    'childrenCount',
    'lifespan',
    'marriageCount',
    'birthYear',
  ],
  defaultPrimaryDimension: 'generation',
  visualParameters: [
    {
      name: 'strokeOpacity',
      label: 'Stroke opacity %',
      type: 'range',
      defaultValue: 1.0,
      min: 0,
      max: 1,
      step: 0.05,
      description: 'Stroke opacity (0 = no stroke, 100 = full opacity)',
      unit: '%',
      formatValue: (v: number) => `${(v * 100).toFixed(0)}%`,
    },
    {
      name: 'layerCount',
      label: 'Layer count',
      type: 'range',
      defaultValue: 1,
      min: 1,
      max: 10,
      step: 1,
      description: 'Number of offset layers for depth effect',
      unit: '',
    },
    {
      name: 'layerOffset',
      label: 'Layer offset px',
      type: 'range',
      defaultValue: 2,
      min: 0,
      max: 10,
      step: 1,
      description: 'Pixel offset between layers',
      unit: 'px',
    },
    {
      name: 'layerOpacityFalloff',
      label: 'Layer opacity falloff %',
      type: 'range',
      defaultValue: 0.3,
      min: 0.1,
      max: 0.9,
      step: 0.1,
      description: 'How quickly layers fade (lower = more subtle)',
      unit: '%',
      formatValue: (v: number) => `${(v * 100).toFixed(0)}%`,
    },
  ],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, nodeShapeTransform, []),
  multiInstance: false,
};

/**
 * Available node shapes
 */
const SHAPES = ['circle', 'square', 'triangle', 'hexagon', 'star'] as const;
type NodeShape = (typeof SHAPES)[number];

// Pre-calculate children counts for all individuals (for performance)
function calculateChildrenCounts(
  gedcomData: TransformerContext['gedcomData'],
): Map<string, number> {
  const childrenMap = new Map<string, number>();

  // Initialize all individuals with 0 children
  Object.keys(gedcomData.individuals).forEach((id) => {
    childrenMap.set(id, 0);
  });

  // Count children by iterating once through all individuals
  Object.values(gedcomData.individuals).forEach((individual) => {
    if (individual?.parents) {
      individual.parents.forEach((parentId) => {
        const currentCount = childrenMap.get(parentId) || 0;
        childrenMap.set(parentId, currentCount + 1);
      });
    }
  });

  return childrenMap;
}

// Pre-calculate marriage counts for all individuals (for performance)
function calculateMarriageCounts(
  gedcomData: TransformerContext['gedcomData'],
): Map<string, number> {
  const marriageMap = new Map<string, number>();

  // Initialize all individuals with 0 marriages
  Object.keys(gedcomData.individuals).forEach((id) => {
    marriageMap.set(id, 0);
  });

  // Count marriages by iterating once through all families
  Object.values(gedcomData.families).forEach((family) => {
    if (family?.husband?.id) {
      const currentCount = marriageMap.get(family.husband.id) || 0;
      marriageMap.set(family.husband.id, currentCount + 1);
    }
    if (family?.wife?.id) {
      const currentCount = marriageMap.get(family.wife.id) || 0;
      marriageMap.set(family.wife.id, currentCount + 1);
    }
  });

  return marriageMap;
}

// Cache for expensive calculations
let cachedChildrenCounts: Map<string, number> | null = null;
let cachedMarriageCounts: Map<string, number> | null = null;
let cacheDataId: string | null = null;

function calculateNodeShape(
  context: TransformerContext,
  individualId: string,
): NodeShape {
  const { gedcomData, dimensions } = context;

  // Create a simple data ID to check if cache is still valid
  const currentDataId = `${String(Object.keys(gedcomData.individuals).length)}-${String(Object.keys(gedcomData.families).length)}`;

  // Clear cache if data has changed
  if (cacheDataId !== currentDataId) {
    cachedChildrenCounts = null;
    cachedMarriageCounts = null;
    cacheDataId = currentDataId;
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
      // Use pre-calculated children counts for performance
      if (!cachedChildrenCounts) {
        cachedChildrenCounts = calculateChildrenCounts(gedcomData);
      }

      const individualChildren = cachedChildrenCounts.get(individualId) || 0;
      const maxChildren = Math.max(...cachedChildrenCounts.values());
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
      // Use pre-calculated marriage counts for performance
      if (!cachedMarriageCounts) {
        cachedMarriageCounts = calculateMarriageCounts(gedcomData);
      }

      const marriageCount = cachedMarriageCounts.get(individualId) || 0;
      const maxMarriages = Math.max(...cachedMarriageCounts.values());
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
        // Use pre-calculated children counts for performance
        if (!cachedChildrenCounts) {
          cachedChildrenCounts = calculateChildrenCounts(gedcomData);
        }

        const individualChildren = cachedChildrenCounts.get(individualId) || 0;
        const maxChildren = Math.max(...cachedChildrenCounts.values());
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
        // Use pre-calculated marriage counts for performance
        if (!cachedMarriageCounts) {
          cachedMarriageCounts = calculateMarriageCounts(gedcomData);
        }

        const marriageCount = cachedMarriageCounts.get(individualId) || 0;
        const maxMarriages = Math.max(...cachedMarriageCounts.values());
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
  const { gedcomData, visualMetadata, visual } = context;

  // Extract visual parameters
  const strokeOpacity = (visual.strokeOpacity ?? 1.0) as number; // Already in 0-1 range
  const layerCount = (visual.layerCount ?? 1) as number;
  const layerOffset = (visual.layerOffset ?? 2) as number;
  const layerOpacityFalloff = (visual.layerOpacityFalloff ?? 0.3) as number; // Already in 0-1 range

  console.log('🔍 nodeShapeTransform called with context:', {
    individualCount: Object.keys(gedcomData.individuals).length,
    dimensions: context.dimensions,
    visual: context.visual,
    strokeOpacity,
    layerCount,
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

    // Map calculated shape choice to a geometry profile (v0: circle or supershape)
    const nodeSize =
      (currentMetadata.size ?? 20) * (currentMetadata.width ?? 1.0);
    const nodeHeight =
      (currentMetadata.size ?? 20) * (currentMetadata.height ?? 1.0);

    const isCircle = calculatedShape === 'circle';
    // Rough presets: triangle (m=3), square-ish (m=4, n1 small), hexagon (m=6), star (m=5 with sharper n values)
    const supershapeParams: Record<string, Record<string, number>> = {
      triangle: { m: 3, n1: 0.2, n2: 1.7, n3: 1.7, a: 1, b: 1 },
      square: { m: 4, n1: 0.2, n2: 1.0, n3: 1.0, a: 1, b: 1 },
      hexagon: { m: 6, n1: 0.2, n2: 1.7, n3: 1.7, a: 1, b: 1 },
      star: { m: 5, n1: 0.1, n2: 0.6, n3: 0.6, a: 1, b: 1 },
    };

    const baseProfile: ShapeProfile = {
      kind: isCircle ? 'circle' : 'supershape',
      size: { width: nodeSize, height: nodeHeight },
      seed: hashStringToInt(
        `${String(context.seed ?? 'default')}::${individual.id}`,
      ),
      detail: { maxVertices: 192 },
      params: isCircle
        ? undefined
        : (supershapeParams[calculatedShape] ?? {
            m: 4,
            n1: 0.2,
            n2: 1.7,
            n3: 1.7,
            a: 1,
            b: 1,
          }),
    };

    // Preserve existing visual metadata and update shape
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      shape: calculatedShape,
      shapeProfile: baseProfile,
      // Add stroke control (0 opacity means no stroke)
      strokeWeight: strokeOpacity > 0 ? (currentMetadata.strokeWeight ?? 1) : 0,
      strokeOpacity: strokeOpacity,
      // Store layer parameters for renderer
      layerCount,
      layerOffset,
      layerOpacityFalloff,
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
