/**
 * Stage 3: Display Data Layer
 *
 * This module transforms metadata into canvas-specific layout data.
 * It maps AugmentedIndividual data to visual properties for rendering.
 *
 * Security: This layer only works with PII-safe metadata, never raw GEDCOM data.
 */

import type { AugmentedIndividual } from '../../../shared/types';

// Canvas-specific data structures
export interface DisplayNode {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  metadata: {
    lifespan?: number;
    isAlive?: boolean;
    birthMonth?: number;
    zodiacSign?: string;
    generation?: number | null;
    relativeGenerationValue?: number;
  };
}

export interface DisplayEdge {
  from: string;
  to: string;
  type: 'parent-child' | 'spouse' | 'sibling';
  weight: number;
  color: string;
  opacity: number;
}

export interface DisplayData {
  nodes: DisplayNode[];
  edges: DisplayEdge[];
  layout: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    scale: number;
  };
  animation: {
    duration: number;
    easing: string;
    stagger: number;
  };
}

/**
 * Transform augmented individuals into display-ready data
 */
export function createDisplayData(
  individuals: AugmentedIndividual[],
  canvasWidth: number,
  canvasHeight: number,
): DisplayData {
  const nodes: DisplayNode[] = [];
  const edges: DisplayEdge[] = [];

  // Calculate layout parameters
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const scale = Math.min(canvasWidth, canvasHeight) / 1000; // Scale factor

  // Create nodes from individuals
  for (const individual of individuals) {
    const node = createDisplayNode(individual, centerX, centerY, scale);
    nodes.push(node);
  }

  // Create edges from relationships
  for (const individual of individuals) {
    // Parent-child relationships
    for (const parentId of individual.parents) {
      edges.push(createParentChildEdge(individual.id, parentId));
    }

    // Spouse relationships
    for (const spouseId of individual.spouses) {
      edges.push(createSpouseEdge(individual.id, spouseId));
    }

    // Sibling relationships
    for (const siblingId of individual.siblings) {
      edges.push(createSiblingEdge(individual.id, siblingId));
    }
  }

  // Remove duplicate edges
  const uniqueEdges = removeDuplicateEdges(edges);

  return {
    nodes,
    edges: uniqueEdges,
    layout: {
      width: canvasWidth,
      height: canvasHeight,
      centerX,
      centerY,
      scale,
    },
    animation: {
      duration: 1000,
      easing: 'easeInOut',
      stagger: 50,
    },
  };
}

/**
 * Create a display node from an individual
 */
function createDisplayNode(
  individual: AugmentedIndividual,
  centerX: number,
  centerY: number,
  scale: number,
): DisplayNode {
  const metadata = individual.metadata;

  // Calculate position based on generation and relative position
  const generation = metadata.generation ?? 0;
  const relativeValue = metadata.relativeGenerationValue ?? 0;

  // Position calculation (simplified - can be enhanced)
  const x = centerX + (relativeValue - 0.5) * 400 * scale;
  const y = centerY + (generation - 2) * 100 * scale;

  // Calculate visual properties from metadata
  const size = calculateNodeSize(metadata);
  const color = calculateNodeColor(metadata);
  const opacity = calculateNodeOpacity(metadata);
  const rotation = calculateNodeRotation(metadata);

  return {
    id: individual.id,
    x,
    y,
    size,
    color,
    opacity,
    rotation,
    metadata: {
      lifespan: metadata.lifespan,
      isAlive: metadata.isAlive,
      birthMonth: metadata.birthMonth,
      zodiacSign: metadata.zodiacSign,
      generation: metadata.generation,
      relativeGenerationValue: metadata.relativeGenerationValue,
    },
  };
}

/**
 * Calculate node size based on metadata
 */
function calculateNodeSize(metadata: AugmentedIndividual['metadata']): number {
  let size = 20; // Base size

  // Adjust based on lifespan
  if (metadata.lifespan) {
    size += Math.min(metadata.lifespan / 10, 30);
  }

  // Adjust based on generation
  if (metadata.generation !== null && metadata.generation !== undefined) {
    size += (5 - metadata.generation) * 2; // Earlier generations are larger
  }

  return Math.max(10, Math.min(60, size));
}

/**
 * Calculate node color based on metadata
 */
function calculateNodeColor(metadata: AugmentedIndividual['metadata']): string {
  // Color based on zodiac sign
  if (metadata.zodiacSign) {
    return getZodiacColor(metadata.zodiacSign);
  }

  // Color based on birth month
  if (metadata.birthMonth) {
    return getMonthColor(metadata.birthMonth);
  }

  // Default color based on alive status
  return metadata.isAlive ? '#4CAF50' : '#9E9E9E';
}

/**
 * Calculate node opacity based on metadata
 */
function calculateNodeOpacity(
  metadata: AugmentedIndividual['metadata'],
): number {
  let opacity = 1.0;

  // Deceased individuals are slightly transparent
  if (metadata.isAlive === false) {
    opacity = 0.7;
  }

  // Adjust based on lifespan (longer life = more opaque)
  if (metadata.lifespan) {
    opacity = Math.max(0.3, Math.min(1.0, opacity + metadata.lifespan / 100));
  }

  return opacity;
}

/**
 * Calculate node rotation based on metadata
 */
function calculateNodeRotation(
  metadata: AugmentedIndividual['metadata'],
): number {
  // Rotation based on birth month (12 months = 360 degrees)
  if (metadata.birthMonth) {
    return (metadata.birthMonth - 1) * 30;
  }

  return 0;
}

/**
 * Create parent-child edge
 */
function createParentChildEdge(childId: string, parentId: string): DisplayEdge {
  return {
    from: parentId,
    to: childId,
    type: 'parent-child',
    weight: 3,
    color: '#2196F3',
    opacity: 0.8,
  };
}

/**
 * Create spouse edge
 */
function createSpouseEdge(individualId: string, spouseId: string): DisplayEdge {
  return {
    from: individualId,
    to: spouseId,
    type: 'spouse',
    weight: 2,
    color: '#E91E63',
    opacity: 0.6,
  };
}

/**
 * Create sibling edge
 */
function createSiblingEdge(
  individualId: string,
  siblingId: string,
): DisplayEdge {
  return {
    from: individualId,
    to: siblingId,
    type: 'sibling',
    weight: 1,
    color: '#FF9800',
    opacity: 0.4,
  };
}

/**
 * Remove duplicate edges
 */
function removeDuplicateEdges(edges: DisplayEdge[]): DisplayEdge[] {
  const seen = new Set<string>();
  const unique: DisplayEdge[] = [];

  for (const edge of edges) {
    const key = `${edge.from}-${edge.to}`;
    const reverseKey = `${edge.to}-${edge.from}`;

    if (!seen.has(key) && !seen.has(reverseKey)) {
      seen.add(key);
      unique.push(edge);
    }
  }

  return unique;
}

/**
 * Get color for zodiac sign
 */
function getZodiacColor(zodiacSign: string): string {
  const colors: Record<string, string> = {
    Aries: '#FF5722',
    Taurus: '#4CAF50',
    Gemini: '#FFC107',
    Cancer: '#2196F3',
    Leo: '#FF9800',
    Virgo: '#9C27B0',
    Libra: '#E91E63',
    Scorpio: '#795548',
    Sagittarius: '#607D8B',
    Capricorn: '#3F51B5',
    Aquarius: '#00BCD4',
    Pisces: '#8BC34A',
  };

  return colors[zodiacSign] || '#9E9E9E';
}

/**
 * Get color for birth month
 */
function getMonthColor(month: number): string {
  const colors = [
    '#FF5722', // January
    '#E91E63', // February
    '#9C27B0', // March
    '#673AB7', // April
    '#3F51B5', // May
    '#2196F3', // June
    '#03A9F4', // July
    '#00BCD4', // August
    '#009688', // September
    '#4CAF50', // October
    '#8BC34A', // November
    '#CDDC39', // December
  ];

  return colors[month - 1] || '#9E9E9E';
}

/**
 * Get display data for a specific individual
 */
export function getDisplayNodeById(
  displayData: DisplayData,
  id: string,
): DisplayNode | undefined {
  return displayData.nodes.find((node) => node.id === id);
}

/**
 * Get all edges connected to a specific node
 */
export function getConnectedEdges(
  displayData: DisplayData,
  nodeId: string,
): DisplayEdge[] {
  return displayData.edges.filter(
    (edge) => edge.from === nodeId || edge.to === nodeId,
  );
}

/**
 * Calculate layout statistics
 */
export function getLayoutStats(displayData: DisplayData) {
  const { nodes, edges } = displayData;

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    parentChildEdges: edges.filter((e) => e.type === 'parent-child').length,
    spouseEdges: edges.filter((e) => e.type === 'spouse').length,
    siblingEdges: edges.filter((e) => e.type === 'sibling').length,
    averageNodeSize:
      nodes.reduce((sum, node) => sum + node.size, 0) / nodes.length,
    averageOpacity:
      nodes.reduce((sum, node) => sum + node.opacity, 0) / nodes.length,
  };
}
