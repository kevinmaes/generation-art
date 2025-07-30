import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { createWebSketch, type SketchConfig } from '../FamilyTreeSketch';
import { CANVAS_DIMENSIONS } from '@utils';
import type { GedcomDataWithMetadata } from '@types';
import type { PipelineResult } from '../../transformers/pipeline';

const DEFAULT_WIDTH = CANVAS_DIMENSIONS.WEB.WIDTH;
const DEFAULT_HEIGHT = CANVAS_DIMENSIONS.WEB.HEIGHT;

interface ArtGeneratorProps {
  width?: number;
  height?: number;
  gedcomData?: GedcomDataWithMetadata;
  pipelineResult?: PipelineResult | null;
  showIndividuals?: boolean;
  showRelations?: boolean;
  onExportReady?: (p5Instance: p5) => void;
  onPipelineResult?: (result: PipelineResult | null) => void;
}

export function ArtGenerator({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  gedcomData,
  pipelineResult,
  showIndividuals = true,
  showRelations = true,
  onExportReady,
  onPipelineResult,
}: ArtGeneratorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  // Notify parent component when pipeline result changes
  useEffect(() => {
    onPipelineResult?.(pipelineResult ?? null);
  }, [pipelineResult, onPipelineResult]);

  // Only create the sketch after pipelineResult is available
  useEffect(() => {
    if (!containerRef.current || !gedcomData) return;

    const container = containerRef.current;

    // Clean up previous instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }
    container.innerHTML = '';

    // Create a proper config object for the sketch
    const sketchConfig: Partial<SketchConfig> = {
      transformerIds: pipelineResult?.config.transformerIds ?? [
        'horizontal-spread-by-generation',
      ],
      temperature: pipelineResult?.config.temperature ?? 0.5,
      seed: pipelineResult?.config.seed,
      showIndividuals,
      showRelations,
    };

    // Pass the pipeline result's visual metadata to the sketch
    const sketch = createWebSketch(
      gedcomData,
      width,
      height,
      sketchConfig,
      pipelineResult?.visualMetadata,
    );
    p5InstanceRef.current = new p5(sketch, container);

    if (onExportReady) {
      onExportReady(p5InstanceRef.current);
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
      container.innerHTML = '';
    };
  }, [
    pipelineResult,
    gedcomData,
    width,
    height,
    showIndividuals,
    showRelations,
    onExportReady,
  ]);

  if (!gedcomData) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      >
        <p className="text-gray-500">No data loaded</p>
      </div>
    );
  }

  if (!pipelineResult) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      >
        <p className="text-gray-500">Click Visualize to generate artwork</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: `${String(width)}px`,
        height: `${String(height)}px`,
      }}
    />
  );
}
