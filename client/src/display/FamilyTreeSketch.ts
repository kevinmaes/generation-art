import type p5 from 'p5';
import { getUniqueEdges } from './components/helpers';
import {
  runPipeline,
  createSimplePipeline,
  type PipelineResult,
} from '../transformers/pipeline';
import type { GedcomDataWithMetadata } from '../../../shared/types';

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

export interface SketchOptions {
  config: SketchConfig;
  gedcomData: GedcomDataWithMetadata;
}

/**
 * Create a sketch function for the given configuration
 */
function createSketch(options: SketchOptions): (p: p5) => void {
  const { config, gedcomData } = options;
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

  // Create pipeline configuration
  const pipelineConfig = createSimplePipeline(transformerIds, {
    temperature,
    seed,
    canvasWidth: width,
    canvasHeight: height,
  });

  return (p: p5) => {
    let pipelineResult: PipelineResult | null = null;
    let pipelineError: string | null = null;

    p.setup = () => {
      void (async () => {
        console.log(
          `🎨 Sketch setup - dimensions: ${String(width)} × ${String(height)}`,
        );

        p.createCanvas(width, height, p.P2D);
        p.pixelDensity(1);
        p.background(255);

        // Run the VisualTransformer pipeline
        try {
          console.log('🔄 Running VisualTransformer pipeline...');
          pipelineResult = await runPipeline(gedcomData, pipelineConfig);
          console.log('✅ Pipeline completed:', pipelineResult);
        } catch (error) {
          console.error('❌ Pipeline failed:', error);
          pipelineError =
            error instanceof Error ? error.message : String(error);
        }
      })();
    };

    p.draw = () => {
      p.background(255);

      if (pipelineError) {
        // Show error state
        p.fill(255, 0, 0);
        p.textSize(16);
        p.textAlign(p.CENTER);
        p.text('Pipeline Error', width / 2, height / 2 - 20);
        p.textSize(12);
        p.text(pipelineError, width / 2, height / 2 + 10);
        return;
      }

      if (!pipelineResult) {
        // Show loading state
        p.fill(100);
        p.textSize(16);
        p.textAlign(p.CENTER);
        p.text('Running Pipeline...', width / 2, height / 2);
        return;
      }

      // Use pipeline results for positioning and styling
      const visualMetadata = pipelineResult.visualMetadata;

      // Draw edges (lines between connected individuals)
      const edges = getUniqueEdges(gedcomData.individuals);
      for (const [id1, id2] of edges) {
        // For now, use simple positioning for edges
        // TODO: Enhance with pipeline-based edge positioning
        const coord1 = getIndividualCoord(id1, width, height);
        const coord2 = getIndividualCoord(id2, width, height);

        const strokeColor = p.color(visualMetadata.strokeColor ?? '#ccc');
        p.stroke(strokeColor);
        p.strokeWeight(visualMetadata.strokeWeight ?? strokeWeight);
        p.line(coord1.x, coord1.y, coord2.x, coord2.y);
      }

      // Draw nodes (individuals) using pipeline results
      for (const ind of gedcomData.individuals) {
        // Use pipeline-generated visual metadata
        const x = visualMetadata.x ?? width / 2;
        const y = visualMetadata.y ?? height / 2;
        const size = visualMetadata.size ?? nodeSize;
        const color = visualMetadata.color ?? colors[0];
        const shape = visualMetadata.shape ?? 'circle';
        const opacity = visualMetadata.opacity ?? 1.0;

        // Apply opacity
        const pColor = p.color(color);
        pColor.setAlpha(opacity * 255);
        p.fill(pColor);

        // Draw shape
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

        // Show names if enabled
        if (showNames) {
          p.fill(0);
          p.textSize(textSize);
          p.textAlign(p.CENTER);
          p.text(ind.name, x, y + size + textSize);
        }
      }

      // Show pipeline info
      p.fill(100);
      p.textSize(10);
      p.textAlign(p.LEFT);
      p.text(`Pipeline: ${transformerIds.join(', ')}`, 10, 20);
      p.text(`Temperature: ${String(temperature)}`, 10, 35);
      if (seed) {
        p.text(`Seed: ${seed}`, 10, 50);
      }
      p.text(
        `Execution: ${String(pipelineResult.executionTime.toFixed(2))}ms`,
        10,
        65,
      );
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

  return createSketch({ config, gedcomData });
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

  return createSketch({ config, gedcomData });
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
