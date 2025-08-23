import { useEffect, useRef } from 'react';
import p5 from 'p5';
import {
  createWebSketch,
  type SketchConfig,
  type EnhancedP5,
} from '../display/FamilyTreeSketch';
import { CANVAS_DIMENSIONS } from '../../../shared/constants';
import type { PipelineResult } from '../pipeline/pipeline';
import { TRANSFORMERS } from '../pipeline/transformers';
import { GenerationProgress } from './GenerationProgress';
import { useFamilyData } from '../contexts/FamilyDataContext';

const DEFAULT_WIDTH = CANVAS_DIMENSIONS.WEB.WIDTH;
const DEFAULT_HEIGHT = CANVAS_DIMENSIONS.WEB.HEIGHT;

interface ArtGeneratorWithContextProps {
  width?: number;
  height?: number;
  pipelineResult?: PipelineResult | null;
  showIndividuals?: boolean;
  showRelations?: boolean;
  onExportReady?: (p5Instance: p5) => void;
  onVisualize?: () => void;
  isVisualizing?: boolean;
  pipelineProgress?: {
    current: number;
    total: number;
    transformerName: string;
  } | null;
  primaryIndividualId?: string;
}

export function ArtGeneratorWithContext({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  pipelineResult,
  showIndividuals = true,
  showRelations = true,
  onExportReady,
  onVisualize,
  isVisualizing = false,
  pipelineProgress = null,
  primaryIndividualId,
}: ArtGeneratorWithContextProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<EnhancedP5 | null>(null);
  
  // Use the context instead of receiving data as props
  const { status, data: gedcomData, error, refetch } = useFamilyData();

  // Handle parameter updates without canvas recreation
  useEffect(() => {
    if (p5InstanceRef.current) {
      p5InstanceRef.current.setShowIndividuals(showIndividuals);
    }
  }, [showIndividuals]);

  useEffect(() => {
    if (p5InstanceRef.current) {
      p5InstanceRef.current.setShowRelations(showRelations);
    }
  }, [showRelations]);

  // Only create the sketch after data and pipelineResult are available
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
    p5InstanceRef.current = new p5(sketch, container) as EnhancedP5;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showIndividuals and showRelations handled in separate useEffects
  }, [pipelineResult, gedcomData, width, height, onExportReady]);

  // Handle different status states from the context
  if (status === 'idle') {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      >
        <p className="text-gray-500">No data source specified</p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading family data...</div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      >
        <div className="text-center max-w-md">
          <div className="text-red-500 text-lg mb-2">Failed to load data</div>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!gedcomData) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        }}
      >
        <div className="text-center">
          <div className="text-gray-500 text-lg">No data available</div>
        </div>
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
          <GenerationProgress progress={pipelineProgress} />
        ) : !primaryIndividualId ? (
          <div className="text-center">
            <p className="text-gray-500 mb-3">
              Please select a primary individual
            </p>
            <button
              disabled
              className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
            >
              Generate art
            </button>
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
          <GenerationProgress progress={pipelineProgress} />
        </div>
      )}
    </div>
  );
}