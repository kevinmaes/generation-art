import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { createWebSketch, type SketchConfig } from '../FamilyTreeSketch';
import { CANVAS_DIMENSIONS } from '../../../../shared/constants';
import type { GedcomDataWithMetadata } from '../../../../shared/types';
import { usePipeline } from './hooks/usePipeline';
import type { PipelineResult } from '../../transformers/pipeline';

const DEFAULT_WIDTH = CANVAS_DIMENSIONS.WEB.WIDTH;
const DEFAULT_HEIGHT = CANVAS_DIMENSIONS.WEB.HEIGHT;

interface ArtGeneratorProps {
  width?: number;
  height?: number;
  gedcomData?: GedcomDataWithMetadata;
  onExportReady?: (p5Instance: p5) => void;
  onPipelineResult?: (result: PipelineResult | null) => void;
}

export function ArtGenerator({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  gedcomData,
  onExportReady,
  onPipelineResult,
}: ArtGeneratorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  const {
    result: pipelineResult,
    error: pipelineError,
    isRunning,
  } = usePipeline(gedcomData, width, height);

  // Notify parent component when pipeline result changes
  useEffect(() => {
    onPipelineResult?.(pipelineResult);
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
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      >
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">
            No GEDCOM data provided
          </div>
          <p className="text-gray-400 text-sm">
            Please provide GEDCOM data to generate artwork
          </p>
        </div>
      </div>
    );
  }

  if (isRunning || !pipelineResult) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Running pipeline...</div>
        </div>
      </div>
    );
  }

  if (pipelineError) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      >
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Pipeline Error</div>
          <p className="text-gray-400 text-sm">{pipelineError}</p>
        </div>
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
