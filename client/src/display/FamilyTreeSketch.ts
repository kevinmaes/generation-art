import type p5 from 'p5';
import { getUniqueEdges } from './components/helpers';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import type { VisualMetadata } from '../transformers/types';

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
}

export interface SketchProps {
  visualMetadata: VisualMetadata;
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
  } = config;

  return (p: p5) => {
    p.setup = () => {
      p.createCanvas(width, height, p.P2D);
      p.pixelDensity(1);
      p.background(255);
    };

    p.draw = () => {
      p.background(255);

      // Draw edges (lines between connected individuals)
      const edges = getUniqueEdges(gedcomData.individuals);
      for (const [id1, id2] of edges) {
        const coord1 = getIndividualCoord(id1, width, height);
        const coord2 = getIndividualCoord(id2, width, height);
        const strokeColor = p.color(visualMetadata.strokeColor ?? '#ccc');
        p.stroke(strokeColor);
        p.strokeWeight(visualMetadata.strokeWeight ?? strokeWeight);
        p.line(coord1.x, coord1.y, coord2.x, coord2.y);
      }

      // Draw nodes (individuals) using pipeline results
      const individuals = Object.values(gedcomData.individuals);
      for (const ind of individuals) {
        const x = visualMetadata.x ?? width / 2;
        const y = visualMetadata.y ?? height / 2;
        const size = visualMetadata.size ?? nodeSize;
        const color = visualMetadata.color ?? colors[0];
        const shape = visualMetadata.shape ?? 'circle';
        const opacity = visualMetadata.opacity ?? 1.0;

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
    ...options,
  };

  // Create initial visual metadata for backward compatibility
  const visualMetadata: VisualMetadata = {
    x: width / 2,
    y: height / 2,
    size: config.nodeSize,
    color: config.colors?.[0] ?? '#0000ff',
    shape: 'circle',
    opacity: 1.0,
    strokeColor: '#ccc',
    strokeWeight: config.strokeWeight,
  };

  return createSketch({ config, gedcomData, visualMetadata });
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
    ...options,
  };

  // Create initial visual metadata for backward compatibility
  const visualMetadata: VisualMetadata = {
    x: width / 2,
    y: height / 2,
    size: config.nodeSize,
    color: config.colors?.[0] ?? '#000000',
    shape: 'circle',
    opacity: 1.0,
    strokeColor: '#ccc',
    strokeWeight: config.strokeWeight,
  };

  return createSketch({ config, gedcomData, visualMetadata });
}

// Helper function for backward compatibility
function getIndividualCoord(
  id: string,
  width: number,
  height: number,
): { x: number; y: number } {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) + hash + id.charCodeAt(i);
  }
  const x = (((hash >>> 0) % 1000) / 1000) * width * 0.8 + width * 0.1;
  const y = ((((hash * 31) >>> 0) % 1000) / 1000) * height * 0.8 + height * 0.1;
  return { x, y };
}
