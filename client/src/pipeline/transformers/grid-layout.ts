/**
 * Grid Layout Transformer
 *
 * Pure positioning transformer that places all individuals on a grid with
 * optional linear fill or spiral fill patterns. Outputs x,y only for nodes
 * and computes simple midpoint positions for edges with start/end coordinates
 * stored in custom fields for the renderer.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualTransformerConfig,
  VisualMetadata,
} from '../types';
import type { AugmentedIndividual } from '../../../../shared/types';
import { createTransformerInstance } from '../utils';

type SortBy = 'birth-date' | 'death-date' | 'name' | 'generation';
type LayoutMode = 'linear' | 'spiral-out' | 'spiral-in';
type FlowDirection = 'ltr-ttb' | 'ttb-ltr';
type SpiralDirection = 'clockwise' | 'counter-clockwise';
type SpacingMode = 'auto' | 'tight' | 'normal' | 'loose';
type AspectRatioPref = 'auto' | 'square' | '16:9' | '4:3' | 'golden';

/**
 * Async wrapper for grid transform
 */
async function gridLayoutTransformAsync(
  context: TransformerContext,
): Promise<{ visualMetadata: CompleteVisualMetadata }> {
  const result = gridLayoutTransform(context);
  await new Promise((resolve) => setTimeout(resolve, 1));
  return { visualMetadata: result };
}

export const gridLayoutConfig: VisualTransformerConfig = {
  id: 'grid-layout',
  name: 'Grid Layout',
  description:
    'Uniform grid positioning for all individuals with linear or spiral fill',
  shortDescription: 'Uniform grid positioning',
  transform: gridLayoutTransformAsync,
  categories: ['layout', 'positioning'],
  availableDimensions: [],
  defaultPrimaryDimension: 'generation',
  multiInstance: true,
  visualParameters: [
    {
      name: 'sortBy',
      type: 'select',
      defaultValue: 'birth-date',
      options: [
        { value: 'birth-date', label: 'Birth date' },
        { value: 'death-date', label: 'Death date' },
        { value: 'name', label: 'Name' },
        { value: 'generation', label: 'Generation' },
      ],
      label: 'Sort by',
      description: 'Ordering of individuals before grid placement',
    },
    {
      name: 'layoutMode',
      type: 'select',
      defaultValue: 'linear',
      options: [
        { value: 'linear', label: 'Linear' },
        { value: 'spiral-out', label: 'Spiral out' },
        { value: 'spiral-in', label: 'Spiral in' },
      ],
      label: 'Layout mode',
      description: 'Grid fill pattern',
    },
    {
      name: 'flowDirection',
      type: 'select',
      defaultValue: 'ltr-ttb',
      options: [
        { value: 'ltr-ttb', label: 'Left-to-right, top-to-bottom' },
        { value: 'ttb-ltr', label: 'Top-to-bottom, left-to-right' },
      ],
      label: 'Flow direction',
      description: 'Linear mode only',
    },
    {
      name: 'spiralDirection',
      type: 'select',
      defaultValue: 'clockwise',
      options: [
        { value: 'clockwise', label: 'Clockwise' },
        { value: 'counter-clockwise', label: 'Counter-clockwise' },
      ],
      label: 'Spiral direction',
      description: 'Spiral rotation (spiral modes only)',
    },
    {
      name: 'padding',
      type: 'range',
      defaultValue: 20,
      min: 0,
      max: 100,
      label: 'Canvas padding px',
      description: 'Padding from canvas edges',
      unit: 'px',
    },
    {
      name: 'spacing',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: 'tight', label: 'Tight' },
        { value: 'normal', label: 'Normal' },
        { value: 'loose', label: 'Loose' },
      ],
      label: 'Cell spacing',
      description: 'Space between grid cells',
    },
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: 'square', label: 'Square' },
        { value: '16:9', label: '16:9' },
        { value: '4:3', label: '4:3' },
        { value: 'golden', label: 'Golden ratio' },
      ],
      label: 'Aspect ratio',
      description: 'Grid aspect ratio preference',
    },
  ],
  getDefaults: () => ({
    sortBy: 'birth-date',
    layoutMode: 'linear',
    flowDirection: 'ltr-ttb',
    spiralDirection: 'clockwise',
    padding: 20,
    spacing: 'auto',
    aspectRatio: 'auto',
  }),
  createTransformerInstance: (params) =>
    createTransformerInstance(
      params,
      gridLayoutTransformAsync,
      gridLayoutConfig.visualParameters || [],
    ),
};

export function gridLayoutTransform(
  context: TransformerContext,
): CompleteVisualMetadata {
  const { gedcomData, visualMetadata } = context;
  const canvasWidth =
    context.canvasWidth ?? visualMetadata.global.canvasWidth ?? 1024;
  const canvasHeight =
    context.canvasHeight ?? visualMetadata.global.canvasHeight ?? 1024;

  const padding = Number(context.visual.padding ?? 20);
  const layoutMode = (context.visual.layoutMode as LayoutMode) ?? 'linear';
  const sortBy = (context.visual.sortBy as SortBy) ?? 'birth-date';
  const flowDirection =
    (context.visual.flowDirection as FlowDirection) ?? 'ltr-ttb';
  const spiralDirection =
    (context.visual.spiralDirection as SpiralDirection) ?? 'clockwise';
  const spacingMode = (context.visual.spacing as SpacingMode) ?? 'auto';
  const aspectPref = (context.visual.aspectRatio as AspectRatioPref) ?? 'auto';

  const individuals = Object.values(gedcomData.individuals).filter(
    (i): i is AugmentedIndividual => i != null,
  );

  const output: CompleteVisualMetadata = {
    ...visualMetadata,
    individuals: {},
    families: visualMetadata.families || {},
    edges: {},
    tree: visualMetadata.tree || {},
    global: visualMetadata.global || {},
  };

  if (individuals.length === 0) {
    return output;
  }

  const sorted = sortIndividuals(individuals, sortBy, layoutMode);

  if (layoutMode === 'linear') {
    applyLinearGrid(
      sorted,
      output,
      canvasWidth,
      canvasHeight,
      padding,
      spacingMode,
      aspectPref,
      flowDirection,
      gedcomData.metadata.edges,
    );
  } else {
    const clockwise = spiralDirection === 'clockwise';
    applySpiralGrid(
      sorted,
      output,
      canvasWidth,
      canvasHeight,
      padding,
      clockwise,
      gedcomData.metadata.edges,
    );
  }

  return output;
}

function sortIndividuals(
  individuals: AugmentedIndividual[],
  sortBy: SortBy,
  layoutMode: LayoutMode,
): AugmentedIndividual[] {
  const arr = [...individuals];

  const getBirthYear = (p: AugmentedIndividual): number | undefined => {
    return p.metadata?.birthYear ?? parseYear(p.birth?.date) ?? undefined;
  };
  const getDeathYear = (p: AugmentedIndividual): number | undefined => {
    return (
      (p.metadata as any)?.deathYear ?? parseYear(p.death?.date) ?? undefined
    );
  };

  const comparator = (a: AugmentedIndividual, b: AugmentedIndividual) => {
    let av: number | string | undefined;
    let bv: number | string | undefined;
    switch (sortBy) {
      case 'birth-date':
        av = getBirthYear(a);
        bv = getBirthYear(b);
        break;
      case 'death-date':
        av = getDeathYear(a);
        bv = getDeathYear(b);
        break;
      case 'name':
        av = a.name || '';
        bv = b.name || '';
        break;
      case 'generation':
        av = a.metadata?.generation ?? Number.MAX_SAFE_INTEGER;
        bv = b.metadata?.generation ?? Number.MAX_SAFE_INTEGER;
        break;
    }

    // Missing values go last
    const aMissing = av === undefined || av === '';
    const bMissing = bv === undefined || bv === '';
    if (aMissing && bMissing) {
      return (a.name || a.id).localeCompare(b.name || b.id);
    }
    if (aMissing) return 1;
    if (bMissing) return -1;

    if (typeof av === 'string' && typeof bv === 'string') {
      const cmp = av.localeCompare(bv);
      if (cmp !== 0) return cmp;
    } else if (typeof av === 'number' && typeof bv === 'number') {
      const cmp = av - bv;
      if (cmp !== 0) return cmp;
    }
    // Stable tie-breaker
    return (a.name || a.id).localeCompare(b.name || b.id);
  };

  arr.sort(comparator);

  // For spiral-out, youngest at center => reverse order to youngest first
  if (layoutMode === 'spiral-out') {
    arr.reverse();
  }

  return arr;
}

function parseYear(date?: string): number | undefined {
  if (!date) return undefined;
  const re = /(\d{4})/;
  const m = re.exec(date);
  return m ? Number(m[1]) : undefined;
}

function getAspectRatio(pref: AspectRatioPref, w: number, h: number): number {
  switch (pref) {
    case 'square':
      return 1;
    case '16:9':
      return 16 / 9;
    case '4:3':
      return 4 / 3;
    case 'golden':
      return (1 + Math.sqrt(5)) / 2;
    case 'auto':
    default:
      return w / h;
  }
}

function applyLinearGrid(
  ordered: AugmentedIndividual[],
  output: CompleteVisualMetadata,
  canvasWidth: number,
  canvasHeight: number,
  padding: number,
  spacing: SpacingMode,
  aspectPref: AspectRatioPref,
  flow: FlowDirection,
  metadataEdges: {
    id: string;
    sourceId: string;
    targetId: string;
    relationshipType: string;
  }[],
): void {
  const contentW = Math.max(0, canvasWidth - 2 * padding);
  const contentH = Math.max(0, canvasHeight - 2 * padding);
  const targetAR = getAspectRatio(aspectPref, contentW, contentH);

  const n = ordered.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(n * targetAR)));
  const rows = Math.max(1, Math.ceil(n / cols));

  let dx = contentW / cols;
  let dy = contentH / rows;

  // Spacing adjustment (mild to avoid overflow)
  const adjust = (mode: SpacingMode) => {
    switch (mode) {
      case 'tight':
        dx *= 0.9;
        dy *= 0.9;
        break;
      case 'loose':
        dx *= 1.1;
        dy *= 1.1;
        break;
      case 'normal':
      case 'auto':
      default:
        break;
    }
  };
  adjust(spacing);

  // Keep within content box
  const cell = Math.min(dx, dy);
  dx = cell;
  dy = cell;

  const startX = padding + dx / 2 + (contentW - cols * dx) / 2;
  const startY = padding + dy / 2 + (contentH - rows * dy) / 2;

  for (let i = 0; i < n; i++) {
    let row: number;
    let col: number;
    if (flow === 'ltr-ttb') {
      row = Math.floor(i / cols);
      col = i % cols;
    } else {
      // Column-first fill
      row = i % rows;
      col = Math.floor(i / rows);
    }
    const x = startX + col * dx;
    const y = startY + row * dy;
    const id = ordered[i].id;
    output.individuals[id] = { x, y, custom: { gridRow: row, gridCol: col } };
  }

  // Build edge metadata (straight lines between node centers)
  output.edges = buildEdges(output.individuals, metadataEdges);
}

function generateSpiralPositions(
  count: number,
  clockwise: boolean,
): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = [];
  let row = 0,
    col = 0;
  let rowDelta = 0,
    colDelta = 1; // Start moving right
  let segmentLength = 1;
  let segmentPassed = 0;

  for (let i = 0; i < count; i++) {
    positions.push({ row, col });

    row += rowDelta;
    col += colDelta;
    segmentPassed++;

    if (segmentPassed === segmentLength) {
      segmentPassed = 0;
      // Rotate direction
      if (clockwise) {
        const temp = rowDelta;
        rowDelta = colDelta;
        colDelta = -temp;
      } else {
        const temp = rowDelta;
        rowDelta = -colDelta;
        colDelta = temp;
      }
      if (colDelta === 0) {
        segmentLength++;
      }
    }
  }

  return positions;
}

function applySpiralGrid(
  ordered: AugmentedIndividual[],
  output: CompleteVisualMetadata,
  canvasWidth: number,
  canvasHeight: number,
  padding: number,
  clockwise: boolean,
  metadataEdges: {
    id: string;
    sourceId: string;
    targetId: string;
    relationshipType: string;
  }[],
): void {
  const contentW = Math.max(0, canvasWidth - 2 * padding);
  const contentH = Math.max(0, canvasHeight - 2 * padding);

  const n = ordered.length;
  const logical = generateSpiralPositions(n, clockwise);

  // Compute bounds
  let minRow = Infinity,
    maxRow = -Infinity,
    minCol = Infinity,
    maxCol = -Infinity;
  for (const p of logical) {
    if (p.row < minRow) minRow = p.row;
    if (p.row > maxRow) maxRow = p.row;
    if (p.col < minCol) minCol = p.col;
    if (p.col > maxCol) maxCol = p.col;
  }
  const gridRows = maxRow - minRow + 1;
  const gridCols = maxCol - minCol + 1;

  const cell = Math.min(contentW / gridCols, contentH / gridRows);
  const gridW = cell * gridCols;
  const gridH = cell * gridRows;
  const startX = padding + (contentW - gridW) / 2 + cell / 2;
  const startY = padding + (contentH - gridH) / 2 + cell / 2;

  for (let i = 0; i < n; i++) {
    const p = logical[i];
    const row = p.row - minRow;
    const col = p.col - minCol;
    const x = startX + col * cell;
    const y = startY + row * cell;
    const idx = i; // index in ordered array already set for center logic
    const id = ordered[idx].id;
    output.individuals[id] = {
      x,
      y,
      custom: { gridRow: row, gridCol: col, spiralIndex: i },
    };
  }

  // Build edges
  output.edges = buildEdges(output.individuals, metadataEdges);
}

function buildEdges(
  nodePositions: Record<string, VisualMetadata>,
  metadataEdges: {
    id: string;
    sourceId: string;
    targetId: string;
    relationshipType: string;
  }[],
): Record<string, VisualMetadata> {
  const edges: Record<string, VisualMetadata> = {};
  metadataEdges.forEach((edge) => {
    const s = nodePositions[edge.sourceId];
    const t = nodePositions[edge.targetId];
    if (!s || !t || s.x == null || s.y == null || t.x == null || t.y == null) {
      return;
    }
    edges[edge.id] = {
      x: (s.x + t.x) / 2,
      y: (s.y + t.y) / 2,
      // Force straight edges and include endpoints for renderer/routing
      curveType: 'straight',
      curveIntensity: 0,
      controlPoints: undefined,
      arcRadius: undefined,
      custom: {
        sourceX: s.x,
        sourceY: s.y,
        targetX: t.x,
        targetY: t.y,
        edgeType: edge.relationshipType,
      },
    } as VisualMetadata;
  });
  return edges;
}
