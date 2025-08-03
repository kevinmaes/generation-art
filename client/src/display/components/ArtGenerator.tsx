import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { createWebSketch, type SketchConfig } from '../FamilyTreeSketch';
import { CANVAS_DIMENSIONS } from '../../../../shared/constants';
import type { GedcomDataWithMetadata } from '../../../../shared/types';
import type { PipelineResult } from '../../transformers/pipeline';
import { TRANSFORMERS } from '../../transformers/transformers';

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
  onVisualize?: () => void;
  isVisualizing?: boolean;
  pipelineProgress?: {
    current: number;
    total: number;
    transformerName: string;
  } | null;
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
  onVisualize,
  isVisualizing = false,
  pipelineProgress = null,
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
    const defaultTransformerIds = [
      TRANSFORMERS.HORIZONTAL_SPREAD.ID,
      TRANSFORMERS.NODE_SHAPE.ID,
    ];
    const transformerIds = pipelineResult?.config.transformers
      ? pipelineResult.config.transformers.map((t) => t.type)
      : defaultTransformerIds;

    const sketchConfig: Partial<SketchConfig> = {
      transformerIds,
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
        {isVisualizing ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 font-medium">Generating art...</p>
            {pipelineProgress && (
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm text-gray-500">
                  Step {pipelineProgress.current} of {pipelineProgress.total}
                </p>
                <p className="text-xs text-gray-400">
                  {pipelineProgress.transformerName}
                </p>
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${String((pipelineProgress.current / pipelineProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onVisualize}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Generate art
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{
        width: `${String(width)}px`,
        height: `${String(height)}px`,
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      />
      {isVisualizing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 font-medium">Generating art...</p>
            {pipelineProgress && (
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm text-gray-500">
                  Step {pipelineProgress.current} of {pipelineProgress.total}
                </p>
                <p className="text-xs text-gray-400">
                  {pipelineProgress.transformerName}
                </p>
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${String((pipelineProgress.current / pipelineProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
