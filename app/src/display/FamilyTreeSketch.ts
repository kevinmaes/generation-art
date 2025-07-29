/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type p5 from 'p5';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import type { CompleteVisualMetadata, VisualMetadata } from '../pipeline/types';

export interface SketchConfig {
  width: number;
  height: number;
  showNames?: boolean;
  strokeWeight?: number;
  textSize?: number;
  nodeSize?: number;
  colors?: string[];
  // VisualTransformer pipeline configuration
  transformerIds?: string[];
  temperature?: number;
  seed?: string;
  // Visibility controls
  showIndividuals?: boolean;
  showRelations?: boolean;
}

export interface SketchProps {
  visualMetadata: CompleteVisualMetadata;
  config: SketchConfig;
  gedcomData: GedcomDataWithMetadata;
}

/**
 * Create a sketch function for the given configuration
 */
function createSketch(props: SketchProps): (p: p5) => void {
  const { config, gedcomData, visualMetadata } = props;
  const {
    width,
    height,
    showNames = false,
    strokeWeight = 0.2,
    textSize = 5,
    nodeSize = 10,
    colors = ['#0000ff', '#ffff00'],
    transformerIds = ['horizontal-spread-by-generation'],
    temperature = 0.5,
    seed,
    showIndividuals = true,
    showRelations = true,
  } = config;

  return (p: p5) => {
    p.setup = () => {
      p.createCanvas(width, height, p.P2D);
      p.pixelDensity(1);
      p.background(255);
    };

    p.draw = () => {
      p.background(255);

      // Draw edges using visual metadata
      if (showRelations) {
        for (const edge of (
          gedcomData.metadata as {
            edges: { id: string; sourceId: string; targetId: string }[];
          }
        ).edges) {
          const coord1 = getIndividualCoord(
            edge.sourceId,
            width,
            height,
            visualMetadata,
          );
          const coord2 = getIndividualCoord(
            edge.targetId,
            width,
            height,
            visualMetadata,
          );

          // Use edge visual metadata (if available)
          const edgeMetadata = visualMetadata.edges[edge.id];
          const strokeColor = p.color(
            edgeMetadata?.strokeColor ??
              visualMetadata.global.defaultEdgeColor ??
              '#ccc',
          );
          p.stroke(strokeColor);
          p.strokeWeight(
            edgeMetadata?.strokeWeight ??
              visualMetadata.global.defaultEdgeWeight ??
              strokeWeight,
          );
          p.line(coord1.x, coord1.y, coord2.x, coord2.y);
        }
      }

      // Draw nodes (individuals) using per-entity visual metadata
      if (showIndividuals) {
        const individuals = Object.values(gedcomData.individuals);
        for (const ind of individuals) {
          const individualMetadata = visualMetadata.individuals[ind.id];
          const x = individualMetadata?.x ?? width / 2;
          const y = individualMetadata?.y ?? height / 2;
          const size =
            individualMetadata?.size ??
            visualMetadata.global.defaultNodeSize ??
            nodeSize;
          const color =
            individualMetadata?.color ??
            visualMetadata.global.defaultNodeColor ??
            colors[0];
          const shape =
            individualMetadata?.shape ??
            visualMetadata.global.defaultNodeShape ??
            'circle';
          const opacity = individualMetadata?.opacity ?? 1.0;

          const pColor = p.color(color);
          pColor.setAlpha(opacity * 255);
          p.fill(pColor);

          p.noStroke();
          if (shape === 'circle') {
            p.circle(x, y, size);
          } else if (shape === 'square') {
            p.rectMode(p.CENTER);
            p.rect(x, y, size, size);
          } else if (shape === 'triangle') {
            p.triangle(
              x,
              y - size / 2,
              x - size / 2,
              y + size / 2,
              x + size / 2,
              y + size / 2,
            );
          }

          if (showNames) {
            p.fill(0);
            p.textSize(textSize);
            p.textAlign(p.CENTER);
            p.text(ind.name, x, y + size + textSize);
          }
        }
      }

      p.fill(100);
      p.textSize(10);
      p.textAlign(p.LEFT);
      p.text(`Pipeline: ${transformerIds.join(', ')}`, 10, 20);
      p.text(`Temperature: ${String(temperature)}`, 10, 35);
      if (seed) {
        p.text(`Seed: ${seed}`, 10, 50);
      }
    };
  };
}

/**
 * Create a web-optimized sketch
 */
export function createWebSketch(
  gedcomData: GedcomDataWithMetadata,
  width: number,
  height: number,
  options?: Partial<SketchConfig>,
  visualMetadata?: CompleteVisualMetadata,
): (p: p5) => void {
  const config: SketchConfig = {
    width,
    height,
    showNames: false,
    strokeWeight: 0.2,
    textSize: 5,
    nodeSize: 10,
    colors: ['#0000ff', '#ffff00'],
    transformerIds: ['horizontal-spread-by-generation'],
    temperature: 0.5,
    showIndividuals: true,
    showRelations: true,
    ...options,
  };

  // Use provided visual metadata or create initial structure
  const finalVisualMetadata: CompleteVisualMetadata =
    visualMetadata ??
    (() => {
      // Initialize edge visual metadata from actual edge data
      const edges: Record<string, VisualMetadata> = {};
      gedcomData.metadata.edges.forEach((edge) => {
        edges[edge.id] = {
          strokeColor: '#ccc',
          strokeWeight: config.strokeWeight,
          strokeStyle: 'solid',
          opacity: 1.0,
          group: 'edges',
          layer: 1,
          priority: 0,
        };
      });

      return {
        individuals: {},
        families: {},
        edges,
        tree: {
          backgroundColor: '#ffffff',
          group: 'tree',
          layer: 0,
          priority: 0,
        },
        global: {
          canvasWidth: width,
          canvasHeight: height,
          backgroundColor: '#ffffff',
          defaultNodeSize: config.nodeSize,
          defaultEdgeWeight: config.strokeWeight,
          defaultNodeColor: config.colors?.[0] ?? '#0000ff',
          defaultEdgeColor: '#ccc',
          defaultNodeShape: 'circle',
          defaultEdgeStyle: 'solid',
        },
      };
    })();

  return createSketch({
    config,
    gedcomData,
    visualMetadata: finalVisualMetadata,
  });
}

/**
 * Create a print-optimized sketch
 */
export function createPrintSketch(
  gedcomData: GedcomDataWithMetadata,
  width: number,
  height: number,
  options?: Partial<SketchConfig>,
): (p: p5) => void {
  const config: SketchConfig = {
    width,
    height,
    showNames: true,
    strokeWeight: 1,
    textSize: 12,
    nodeSize: 20,
    colors: ['#000000', '#666666'],
    transformerIds: ['horizontal-spread-by-generation'],
    temperature: 0.3,
    showIndividuals: true,
    showRelations: true,
    ...options,
  };

  // Create initial complete visual metadata structure
  const visualMetadata: CompleteVisualMetadata = {
    individuals: {},
    families: {},
    edges: {},
    tree: {
      backgroundColor: '#ffffff',
      group: 'tree',
      layer: 0,
      priority: 0,
    },
    global: {
      canvasWidth: width,
      canvasHeight: height,
      backgroundColor: '#ffffff',
      defaultNodeSize: config.nodeSize,
      defaultEdgeWeight: config.strokeWeight,
      defaultNodeColor: config.colors?.[0] ?? '#000000',
      defaultEdgeColor: '#ccc',
      defaultNodeShape: 'circle',
      defaultEdgeStyle: 'solid',
    },
  };

  return createSketch({ config, gedcomData, visualMetadata });
}

/**
 * Get individual coordinates from visual metadata
 */
function getIndividualCoord(
  id: string,
  width: number,
  height: number,
  visualMetadata: CompleteVisualMetadata,
): { x: number; y: number } {
  const individualMetadata = visualMetadata.individuals[id];
  if (
    individualMetadata?.x !== undefined &&
    individualMetadata?.y !== undefined
  ) {
    return { x: individualMetadata.x, y: individualMetadata.y };
  }

  // Fallback to hash-based positioning if no position data
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) + hash + id.charCodeAt(i);
  }
  const x = (((hash >>> 0) % 1000) / 1000) * width * 0.8 + width * 0.1;
  const y = ((((hash * 31) >>> 0) % 1000) / 1000) * height * 0.8 + height * 0.1;
  return { x, y };
}
