/**
 * Edge Curve Transformer
 *
 * Transforms straight edges into various curved edge types:
 * - Bezier curves (quadratic and cubic)
 * - Arc curves
 * - Catenary curves (hanging rope effect)
 * - Step curves (right-angle connections)
 * - S-curves (sinusoidal waves)
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  VisualTransformerConfig,
} from '../types';
import {
  getIndividualOrWarn,
  validateEdgeReferences,
} from '../utils/transformer-guards';
import { createTransformerInstance } from '../utils';

interface Point {
  x: number;
  y: number;
}

type ControlPointCalculator = (
  start: Point,
  end: Point,
  intensity: number,
  metadata?: any,
) => Point[];

type ControlPointStrategy = (
  start: Point,
  end: Point,
  nodeData: any,
) => { intensity: number; direction: number };

/**
 * Control point calculators for different curve types
 */
const CONTROL_POINT_CALCULATORS: Record<string, ControlPointCalculator> = {
  'bezier-quad': (start, end, intensity) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const perpX = -dy * intensity * 0.3;
    const perpY = dx * intensity * 0.3;

    return [{ x: midX + perpX, y: midY + perpY }];
  },

  'bezier-cubic': (start, end, intensity) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const perpX = -dy * intensity * 0.2;
    const perpY = dx * intensity * 0.2;

    return [
      { x: start.x + dx * 0.33 + perpX, y: start.y + dy * 0.33 + perpY },
      { x: start.x + dx * 0.67 + perpX, y: start.y + dy * 0.67 + perpY },
    ];
  },

  arc: (_start, _end, _intensity) => [], // Arc doesn't need pre-calculated control points

  step: (_start, _end, _intensity) => [], // Step doesn't need control points

  's-curve': (_start, _end, _intensity) => [], // S-curve calculates inline

  catenary: (_start, _end, _intensity) => [], // Catenary calculates inline

  straight: (_start, _end, _intensity) => [], // Straight line needs no control points
};

/**
 * Control point strategies for determining curve behavior
 */
const CONTROL_POINT_STRATEGIES: Record<string, ControlPointStrategy> = {
  midpoint: (_start, _end) => ({
    intensity: 0.5,
    direction: 1,
  }),

  weighted: (_start, _end, nodeData) => {
    const sourceImportance = nodeData.sourceNode?.metadata?.childrenCount || 1;
    const targetImportance = nodeData.targetNode?.metadata?.childrenCount || 1;
    const totalImportance = sourceImportance + targetImportance;

    return {
      intensity: Math.min(1, totalImportance / 10),
      direction: sourceImportance > targetImportance ? 1 : -1,
    };
  },

  symmetric: (start, end) => ({
    intensity: 0.7,
    direction: Math.sign(end.x - start.x), // Curve direction based on x-direction
  }),

  organic: (_start, _end, nodeData) => {
    // Use seed for reproducible "randomness"
    const seedValue = nodeData.edgeId ? nodeData.edgeId.length * 31 : 42;
    const pseudoRandom1 = (Math.sin(seedValue) + 1) / 2;
    const pseudoRandom2 = (Math.cos(seedValue * 1.61803) + 1) / 2;

    return {
      intensity: 0.3 + pseudoRandom1 * 0.4, // Range 0.3-0.7
      direction: pseudoRandom2 > 0.5 ? 1 : -1,
    };
  },
};

/**
 * Configuration for the edge curve transformer
 */
export const edgeCurveConfig: VisualTransformerConfig = {
  id: 'edge-curve',
  name: 'Edge Curve',
  description:
    'Transforms straight relationship lines into curved connections using various curve types including bezier, arc, catenary, and step curves.',
  shortDescription: 'Creates curved edges with various curve types',
  transform: edgeCurveTransform,
  categories: ['visual', 'edge', 'curve'],
  availableDimensions: [
    'generation',
    'childrenCount',
    'lifespan',
    'relationshipDensity',
  ],
  defaultPrimaryDimension: 'generation',
  defaultSecondaryDimension: 'relationshipDensity',
  visualParameters: [
    {
      name: 'curveType',
      type: 'select',
      defaultValue: 'bezier-quad',
      label: 'Curve Type',
      description: 'Type of curve to apply to edges',
      options: [
        { value: 'straight', label: 'Straight' },
        { value: 'bezier-quad', label: 'Bezier Quadratic' },
        { value: 'bezier-cubic', label: 'Bezier Cubic' },
        { value: 'arc', label: 'Arc' },
        { value: 'catenary', label: 'Catenary (Hanging)' },
        { value: 'step', label: 'Step (Right Angle)' },
        { value: 's-curve', label: 'S-Curve' },
      ],
    },
    {
      name: 'curveIntensity',
      type: 'range',
      defaultValue: 0.5,
      label: 'Curve intensity %',
      description: 'How pronounced the curve should be',
      min: 0.0,
      max: 1.0,
      step: 0.1,
      unit: '%',
      formatValue: (v: number) => `${(v * 100).toFixed(0)}%`,
    },
    {
      name: 'controlPointStrategy',
      type: 'select',
      defaultValue: 'midpoint',
      label: 'Control Point Strategy',
      description: 'How to determine curve behavior',
      options: [
        { value: 'midpoint', label: 'Midpoint' },
        { value: 'weighted', label: 'Weighted by Importance' },
        { value: 'symmetric', label: 'Symmetric' },
        { value: 'organic', label: 'Organic (Varied)' },
      ],
    },
    {
      name: 'relationshipCurves',
      type: 'boolean',
      defaultValue: true,
      label: 'Relationship-Based Curves',
      description: 'Apply different curves based on relationship type',
    },
  ],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, edgeCurveTransform),
  multiInstance: false,
};

/**
 * Calculate curve properties for an edge based on dimensions and visual parameters
 */
function calculateCurveProperties(
  context: TransformerContext,
  edgeId: string,
): Partial<VisualMetadata> {
  const { gedcomData, visualMetadata, dimensions, visual } = context;

  // Find the edge
  const edge = gedcomData.metadata.edges.find((e) => e.id === edgeId);
  if (!edge) return { curveType: 'straight' };

  // Validate edge references
  if (
    !validateEdgeReferences(gedcomData, edge.sourceId, edge.targetId, edgeId)
  ) {
    return { curveType: 'straight' };
  }

  const sourceIndividual = getIndividualOrWarn(
    gedcomData,
    edge.sourceId,
    'Edge curve transformer',
  );
  const targetIndividual = getIndividualOrWarn(
    gedcomData,
    edge.targetId,
    'Edge curve transformer',
  );

  if (!sourceIndividual || !targetIndividual) {
    return { curveType: 'straight' };
  }

  // Get visual parameters
  const curveType = (visual.curveType as string) || 'bezier-quad';
  const baseIntensity = (visual.curveIntensity as number) || 0.5;
  const strategy = (visual.controlPointStrategy as string) || 'midpoint';
  const relationshipCurves = !(visual.relationshipCurves === false);

  // Get node positions for curve calculations
  const sourceVisual = visualMetadata.individuals?.[edge.sourceId];
  const targetVisual = visualMetadata.individuals?.[edge.targetId];

  const start: Point = {
    x: sourceVisual?.x ?? 0,
    y: sourceVisual?.y ?? 0,
  };
  const end: Point = {
    x: targetVisual?.x ?? 0,
    y: targetVisual?.y ?? 0,
  };

  // Adjust curve type based on relationship if enabled
  let actualCurveType = curveType;
  if (relationshipCurves) {
    if (edge.relationshipType === 'parent-child') {
      // Parent-child relationships get more pronounced curves
      actualCurveType = curveType === 'straight' ? 'bezier-quad' : curveType;
    } else if (edge.relationshipType === 'spouse') {
      // Spouse relationships get gentler curves
      actualCurveType = 'arc';
    } else if (edge.relationshipType === 'sibling') {
      // Sibling relationships get step curves
      actualCurveType = 'step';
    }
  }

  // Calculate dimension-based intensity modifiers
  let primaryValue = 0.5; // Default fallback for primary dimension
  let secondaryValue = 0.5; // Default fallback for secondary dimension

  // Primary dimension calculation
  const primaryDimension = dimensions.primary;
  switch (primaryDimension) {
    case 'generation': {
      const sourceGen = sourceIndividual.metadata?.generation ?? 0;
      const targetGen = targetIndividual.metadata?.generation ?? 0;
      const genDistance = Math.abs(sourceGen - targetGen);
      const maxGenDistance = 5; // Assume max 5 generations apart
      // More generations apart = higher value (more curve)
      primaryValue = Math.min(1.0, genDistance / maxGenDistance);
      break;
    }
    case 'childrenCount': {
      const allIndividuals = Object.values(gedcomData.individuals).filter(
        (ind) => ind !== null && ind !== undefined,
      );
      const sourceChildren = allIndividuals.filter((child) =>
        child?.parents?.includes(sourceIndividual.id),
      ).length;
      const targetChildren = allIndividuals.filter((child) =>
        child?.parents?.includes(targetIndividual.id),
      ).length;
      const totalChildren = sourceChildren + targetChildren;
      const maxChildrenSum = 20; // Assume max 20 combined children
      // More children = lower value (less curve for clarity)
      primaryValue = Math.max(0.1, 1 - totalChildren / maxChildrenSum);
      break;
    }
    case 'lifespan': {
      const sourceLifespan = sourceIndividual.metadata?.lifespan ?? 0;
      const targetLifespan = targetIndividual.metadata?.lifespan ?? 0;
      const avgLifespan = (sourceLifespan + targetLifespan) / 2;
      const maxLifespan = 100; // Assume max 100 years
      primaryValue = Math.min(1.0, avgLifespan / maxLifespan);
      break;
    }
    case 'relationshipDensity': {
      if (edge.relationshipType === 'parent-child') {
        primaryValue = 1.0; // Strongest curves
      } else if (edge.relationshipType === 'spouse') {
        primaryValue = 0.6; // Medium curves
      } else {
        primaryValue = 0.8; // Moderate curves (sibling or other)
      }
      break;
    }
  }

  // Secondary dimension calculation (if specified)
  const secondaryDimension = dimensions.secondary;
  if (secondaryDimension && secondaryDimension !== primaryDimension) {
    switch (secondaryDimension) {
      case 'generation': {
        const sourceGen = sourceIndividual.metadata?.generation ?? 0;
        const targetGen = targetIndividual.metadata?.generation ?? 0;
        const genDistance = Math.abs(sourceGen - targetGen);
        const maxGenDistance = 5;
        secondaryValue = Math.min(1.0, genDistance / maxGenDistance);
        break;
      }
      case 'childrenCount': {
        const allIndividuals = Object.values(gedcomData.individuals).filter(
          (ind) => ind !== null && ind !== undefined,
        );
        const sourceChildren = allIndividuals.filter((child) =>
          child?.parents?.includes(sourceIndividual.id),
        ).length;
        const targetChildren = allIndividuals.filter((child) =>
          child?.parents?.includes(targetIndividual.id),
        ).length;
        const totalChildren = sourceChildren + targetChildren;
        const maxChildrenSum = 20;
        secondaryValue = Math.max(0.1, 1 - totalChildren / maxChildrenSum);
        break;
      }
      case 'lifespan': {
        const sourceLifespan = sourceIndividual.metadata?.lifespan ?? 0;
        const targetLifespan = targetIndividual.metadata?.lifespan ?? 0;
        const avgLifespan = (sourceLifespan + targetLifespan) / 2;
        const maxLifespan = 100;
        secondaryValue = Math.min(1.0, avgLifespan / maxLifespan);
        break;
      }
      case 'relationshipDensity': {
        if (edge.relationshipType === 'parent-child') {
          secondaryValue = 1.0;
        } else if (edge.relationshipType === 'spouse') {
          secondaryValue = 0.6;
        } else {
          secondaryValue = 0.8; // sibling or other
        }
        break;
      }
    }
  }

  // Apply strategy to determine final curve properties
  const strategyFn = CONTROL_POINT_STRATEGIES[strategy];
  const nodeData = {
    sourceNode: sourceIndividual,
    targetNode: targetIndividual,
    edgeId: edge.id,
  };

  const { intensity: strategyIntensity, direction } = strategyFn
    ? strategyFn(start, end, nodeData)
    : { intensity: 0.5, direction: 1 };

  // Ensure no NaN values before combining
  const safePrimaryValue = isNaN(primaryValue) ? 0.5 : primaryValue;
  const safeSecondaryValue = isNaN(secondaryValue) ? 0.5 : secondaryValue;
  const safeStrategyIntensity = isNaN(strategyIntensity)
    ? 0.5
    : strategyIntensity;

  // Combine primary and secondary dimensions (primary has more weight)
  const combinedDimensionValue =
    safePrimaryValue * 0.7 + safeSecondaryValue * 0.3;

  // Apply base intensity, dimension influence, and strategy
  const finalIntensity =
    baseIntensity * combinedDimensionValue * safeStrategyIntensity;

  // Calculate control points if needed
  const calculator = CONTROL_POINT_CALCULATORS[actualCurveType];
  const controlPoints = calculator
    ? calculator(start, end, finalIntensity * direction)
    : [];

  // Calculate arc radius for arc curves
  const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const arcRadius = distance * 0.5 * finalIntensity;

  return {
    curveType: actualCurveType as VisualMetadata['curveType'],
    controlPoints,
    arcRadius,
    curveIntensity: finalIntensity,
  };
}

/**
 * Edge curve transform function
 * Applies curve calculations to all edges based on selected dimensions
 */
export async function edgeCurveTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData } = context;

  const edges = gedcomData.metadata.edges;
  if (edges.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated edge visual metadata
  const updatedEdges: Record<string, VisualMetadata> = {};

  // Apply curve calculations to each edge
  edges.forEach((edge) => {
    const currentMetadata = context.visualMetadata.edges[edge.id] ?? {};
    const curveProperties = calculateCurveProperties(context, edge.id);

    // Preserve existing visual metadata and add curve properties
    updatedEdges[edge.id] = {
      ...currentMetadata,
      ...curveProperties,
    };
  });

  // Small delay to simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      edges: updatedEdges,
    },
  };
}
