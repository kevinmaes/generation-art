import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { createWebSketch, type SketchConfig } from '../FamilyTreeSketch';
import { CANVAS_DIMENSIONS } from '../../../../shared/constants';
import type { GedcomDataWithMetadata } from '../../../../shared/types';
import type { PipelineResult } from '../../transformers/pipeline';

const DEFAULT_WIDTH = CANVAS_DIMENSIONS.WEB.WIDTH;
const DEFAULT_HEIGHT = CANVAS_DIMENSIONS.WEB.HEIGHT;

interface ArtGeneratorProps {
  width?: number;
  height?: number;
  gedcomData?: GedcomDataWithMetadata;
  pipelineResult?: PipelineResult | null;
  onExportReady?: (p5Instance: p5) => void;
  onPipelineResult?: (result: PipelineResult | null) => void;
}

export function ArtGenerator({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  gedcomData,
  pipelineResult,
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
    if (!containerRef.current || !pipelineResult || !gedcomData) return;

    const container = containerRef.current;

    // Clean up previous instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }
    container.innerHTML = '';

    // Create a proper config object for the sketch
    const sketchConfig: Partial<SketchConfig> = {
      transformerIds: pipelineResult.config.transformerIds,
      temperature: pipelineResult.config.temperature,
      seed: pipelineResult.config.seed,
    };

    // Pass the pipeline result to the sketch
    const sketch = createWebSketch(gedcomData, width, height, sketchConfig);
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
  }, [pipelineResult, gedcomData, width, height, onExportReady]);

  if (!gedcomData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data loaded</p>
      </div>
    );
  }

  if (!pipelineResult) {
    return (
      <div className="flex items-center justify-center h-full">
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
