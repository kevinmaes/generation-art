import { useEffect, useRef, useState, useCallback } from 'react';
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
import { NodeTooltip } from './NodeTooltip';
import { useSelectedIndividual } from '../hooks/useSelectedIndividual';
import type { GedcomDataWithMetadata, Individual } from '../../../shared/types';
import { getContrastColor } from '../constants/colors';

const DEFAULT_WIDTH = CANVAS_DIMENSIONS.WEB.WIDTH;
const DEFAULT_HEIGHT = CANVAS_DIMENSIONS.WEB.HEIGHT;

interface ArtGeneratorProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
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
  gedcomData?: GedcomDataWithMetadata | null;
  onSetPrimaryIndividual?: (id: string) => void;
}

export function ArtGenerator({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  backgroundColor,
  pipelineResult,
  showIndividuals = true,
  showRelations = true,
  onExportReady,
  onVisualize,
  isVisualizing = false,
  pipelineProgress = null,
  primaryIndividualId,
  gedcomData,
  onSetPrimaryIndividual: _onSetPrimaryIndividual,
}: ArtGeneratorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<EnhancedP5 | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    individual: Individual;
    position: { x: number; y: number };
  } | null>(null);
  const [canvasBounds, setCanvasBounds] = useState<DOMRect | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setSelectedIndividualId } = useSelectedIndividual();

  // Handle click callback
  const handleNodeClick = useCallback(
    (nodeId: string | null) => {
      console.log('ArtGenerator handleNodeClick called with:', nodeId);
      setSelectedIndividualId(nodeId);
    },
    [setSelectedIndividualId],
  );

  // Handle hover callback (simplified - just for showing tooltips)
  const handleNodeHover = useCallback(
    (nodeId: string | null, position: { x: number; y: number } | null) => {
      // Clear any existing timeout
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }

      if (nodeId && position && gedcomData) {
        const individual = gedcomData.individuals[nodeId];
        // individual check is necessary because nodeId might not exist in the data
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (individual) {
          setHoveredNode({ individual, position });
        }
      } else {
        // Hide tooltip after a short delay
        tooltipTimeoutRef.current = setTimeout(() => {
          setHoveredNode(null);
        }, 300);
      }
    },
    [gedcomData],
  );

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
      backgroundColor,
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

    // Set up callbacks
    p5InstanceRef.current.setHoverCallback(handleNodeHover);
    p5InstanceRef.current.setClickCallback(handleNodeClick);

    // Update canvas bounds
    const bounds = container.getBoundingClientRect();
    setCanvasBounds(bounds);

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
  }, [
    pipelineResult,
    gedcomData,
    width,
    height,
    backgroundColor,
    onExportReady,
    handleNodeHover,
    handleNodeClick,
  ]);

  // Handle case where no data is provided
  if (!gedcomData) {
    const bgColor = backgroundColor ?? '#ffffff';
    const textColor = getContrastColor(bgColor);
    const isLightBg = textColor === '#000000';
    
    return (
      <div
        className="flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
          backgroundColor: bgColor,
          borderColor: isLightBg ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="text-center">
          <div className="text-lg font-medium" style={{ color: textColor, opacity: 0.6 }}>
            No data available
          </div>
        </div>
      </div>
    );
  }

  if (!pipelineResult) {
    const bgColor = backgroundColor ?? '#ffffff';
    const textColor = getContrastColor(bgColor);
    const isLightBg = textColor === '#000000';
    
    return (
      <div
        className="flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200"
        style={{
          width: `${String(width)}px`,
          height: `${String(height)}px`,
          backgroundColor: bgColor,
          borderColor: isLightBg ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
        }}
      >
        {isVisualizing ? (
          <GenerationProgress progress={pipelineProgress} />
        ) : !primaryIndividualId ? (
          <div className="text-center">
            <p className="mb-3 font-medium" style={{ color: textColor, opacity: 0.7 }}>
              Please select a primary individual
            </p>
            <button
              disabled
              className="px-6 py-3 rounded-lg cursor-not-allowed font-medium transition-colors"
              style={{
                backgroundColor: isLightBg ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                color: textColor,
                opacity: 0.5,
              }}
            >
              Generate art
            </button>
          </div>
        ) : (
          <button
            onClick={onVisualize}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-lg"
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
      {hoveredNode && canvasBounds && !isVisualizing && (
        <NodeTooltip
          individual={hoveredNode.individual}
          position={hoveredNode.position}
          canvasBounds={canvasBounds}
          isDevelopment={process.env.NODE_ENV === 'development'}
        />
      )}
    </div>
  );
}
