import React, { useState } from 'react';
import ReactJson from 'react-json-view';
import type { PipelineResult } from '../../../pipeline/types';
import { createInitialCompleteVisualMetadata } from '../../../pipeline/pipeline';
import {
  transformers,
  type TransformerId,
  getTransformer,
  getTransformerIds,
  isTransformerId,
} from '../../../pipeline/transformers';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../../../shared/types';
import { TransformerItem } from './TransformerItem';

// Type for the complete dual-data structure
interface DualGedcomData {
  full: GedcomDataWithMetadata;
  llm: LLMReadyData;
}

interface PipelineManagerProps {
  pipelineResult: PipelineResult | null;
  activeTransformerIds: TransformerId[];
  dualData?: DualGedcomData;
  onTransformerSelect?: (transformerId: TransformerId) => void;
  onAddTransformer?: (transformerId: TransformerId) => void;
  onRemoveTransformer?: (transformerId: TransformerId) => void;
  onParameterChange?: (
    transformerId: TransformerId,
    parameters: {
      dimensions: { primary?: string; secondary?: string };
      visual: Record<string, unknown>;
    },
  ) => void;
  onVisualize?: () => void;
  isVisualizing?: boolean;
  hasData?: boolean;

  lastRunParameters?: Record<
    string,
    {
      dimensions: { primary?: string; secondary?: string };
      visual: Record<string, unknown>;
    }
  >;
}

// Utility function to calculate diff between two visual metadata objects
function calculateVisualMetadataDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  path = '',
): Record<string, unknown> | null {
  if (before !== after) {
    const diff = `${JSON.stringify(before)} → ${JSON.stringify(after)}`;
    return { [path]: { before, after, diff } };
  }

  const result: Record<string, unknown> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const beforeValue = before[key];
    const afterValue = after[key];

    if (!(key in before)) {
      result[key] = { added: afterValue };
    } else if (!(key in after)) {
      result[key] = { removed: beforeValue };
    } else {
      const diff = calculateVisualMetadataDiff(
        beforeValue as Record<string, unknown>,
        afterValue as Record<string, unknown>,
        currentPath,
      );
      if (diff !== null) {
        result[key] = diff;
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

export function PipelineManager({
  pipelineResult,
  activeTransformerIds,
  dualData,
  onTransformerSelect,
  onAddTransformer,
  onRemoveTransformer,
  onParameterChange,
  onVisualize,
  isVisualizing = false,
  hasData = false,
  lastRunParameters,
}: PipelineManagerProps): React.ReactElement {
  const [showDiff, setShowDiff] = React.useState(false);
  const [selectedTransformerId, setSelectedTransformerId] =
    useState<TransformerId | null>(activeTransformerIds[0] ?? null);

  // Store parameters for all transformers (persistent across pipeline changes)
  const [transformerParameters, setTransformerParameters] = React.useState<
    Record<
      string,
      {
        dimensions: { primary?: string; secondary?: string };
        visual: Record<string, unknown>;
      }
    >
  >({});

  // Handle parameter changes (immediately apply to pipeline)
  const handleParameterChange = (
    transformerId: string,
    parameters: {
      dimensions: { primary?: string; secondary?: string };
      visual: Record<string, unknown>;
    },
  ) => {
    // Use type guard to ensure valid transformer ID
    if (!isTransformerId(transformerId)) {
      console.warn(`Invalid transformer ID: ${transformerId}`);
      return;
    }

    // Ensure we have valid parameters with defaults
    const transformer = getTransformer(transformerId);
    const validParameters = {
      dimensions: {
        primary:
          parameters.dimensions.primary ??
          String(transformer.defaultPrimaryDimension || ''),
        secondary:
          parameters.dimensions.secondary ??
          String(transformer.defaultSecondaryDimension || ''),
      },
      visual: parameters.visual,
    };

    setTransformerParameters((prev) => ({
      ...prev,
      [transformerId]: validParameters,
    }));
    onParameterChange?.(transformerId, validParameters);
  };

  const handleParameterReset = (transformerId: string) => {
    if (!isTransformerId(transformerId)) {
      console.warn(`Invalid transformer ID: ${transformerId}`);
      return;
    }

    const transformer = getTransformer(transformerId);
    const defaultParameters = {
      dimensions: {
        primary: String(transformer.defaultPrimaryDimension ?? ''),
        secondary: String(transformer.defaultSecondaryDimension ?? ''),
      },
      visual: {},
    };
    setTransformerParameters((prev) => ({
      ...prev,
      [transformerId]: defaultParameters,
    }));
    handleParameterChange(transformerId, defaultParameters);
  };

  // Handle visualization
  const _handleVisualize = () => {
    onVisualize?.();
  };

  const handleTransformerSelect = (transformerId: TransformerId) => {
    setSelectedTransformerId(transformerId);
    onTransformerSelect?.(transformerId);
  };

  // Note: selectedTransformer is no longer used since we show complete pipeline data

  const availableTransformerIds: TransformerId[] = getTransformerIds().filter(
    (id) => !activeTransformerIds.includes(id),
  );

  // Memoize the pipeline input to avoid expensive recalculations
  const pipelineInput = React.useMemo(() => {
    if (!dualData || activeTransformerIds.length === 0) {
      return null;
    }

    return {
      fullData: dualData.full,
      llmData: dualData.llm,
      visualMetadata: createInitialCompleteVisualMetadata(
        dualData.full,
        800, // Default canvas width
        600, // Default canvas height
      ),
      config: {
        transformerIds: activeTransformerIds,
        temperature: 0.5, // Default temperature
        canvasWidth: 800, // Default canvas width
        canvasHeight: 600, // Default canvas height
      },
    };
  }, [dualData, activeTransformerIds]); // Only recalculate when data or transformer list changes

  const _isVisualizeEnabled =
    hasData && activeTransformerIds.length > 0 && !isVisualizing;

  return (
    <div className="h-full flex flex-col bg-white p-6">
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Top-Left: Active Pipeline */}
        <div className="border rounded-lg p-4 flex flex-col min-h-0">
          <h4 className="font-medium mb-3 text-gray-700">Active Pipeline</h4>
          <div
            className="flex-1 overflow-y-auto space-y-2 min-h-0"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 #f1f1f1',
            }}
          >
            {activeTransformerIds.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No transformers in pipeline
              </p>
            ) : (
              activeTransformerIds.map((transformerId, index) => {
                const transformer = getTransformer(transformerId);
                const isSelected = selectedTransformerId === transformerId;

                return (
                  <TransformerItem
                    key={transformerId}
                    transformer={transformer}
                    isSelected={isSelected}
                    handleTransformerSelect={handleTransformerSelect}
                    index={index}
                    isInPipeline={true}
                    onAddTransformer={onAddTransformer}
                    onRemoveTransformer={onRemoveTransformer}
                    onParameterChange={handleParameterChange}
                    onParameterReset={handleParameterReset}
                    currentParameters={
                      transformerParameters[transformerId] ?? {
                        dimensions: {
                          primary: String(
                            transformer.defaultPrimaryDimension ?? '',
                          ),
                          secondary: String(
                            transformer.defaultSecondaryDimension ?? '',
                          ),
                        },
                        visual: {},
                      }
                    }
                    isVisualizing={isVisualizing}
                    lastRunParameters={lastRunParameters?.[transformerId]}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Top-Right: Pipeline Input */}
        <div className="border rounded-lg p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700">
              Pipeline Input
              {pipelineInput && activeTransformerIds.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  (Data going into "
                  {transformers[activeTransformerIds[0]].name ||
                    activeTransformerIds[0]}
                  ")
                </span>
              )}
            </h4>
            {pipelineInput && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      JSON.stringify(pipelineInput, null, 2),
                    );
                  }}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                  title="Copy as JSON"
                >
                  Copy JSON
                </button>
                {pipelineResult && (
                  <button
                    onClick={() => {
                      setShowDiff(!showDiff);
                    }}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                    title="Show diff between input and output"
                  >
                    {showDiff ? 'Hide Diff' : 'Show Diff'}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            {pipelineInput ? (
              <div
                className="h-full border rounded bg-gray-50"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#888 #f1f1f1',
                  overflow: 'auto',
                  overflowX: 'auto',
                  overflowY: 'auto',
                }}
              >
                <ReactJson
                  src={
                    showDiff && pipelineResult
                      ? calculateVisualMetadataDiff(
                          pipelineInput as unknown as Record<string, unknown>,
                          pipelineResult.visualMetadata as unknown as Record<
                            string,
                            unknown
                          >,
                        ) || {}
                      : pipelineInput
                  }
                  theme="rjv-default"
                  style={{
                    backgroundColor: 'transparent',
                    fontSize: '11px',
                    textAlign: 'left',
                    padding: '8px',
                  }}
                  name={null}
                  collapsed={3}
                  enableClipboard={false}
                  displayDataTypes={false}
                  displayObjectSize={true}
                  indentWidth={2}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                {dualData
                  ? 'Add transformers to see pipeline input'
                  : 'Load data to see pipeline input'}
              </div>
            )}
          </div>
        </div>

        {/* Bottom-Left: Available Transformers */}
        <div className="border rounded-lg p-4 flex flex-col min-h-0">
          <h4 className="font-medium mb-3 text-gray-700">
            Available Transformers
          </h4>
          <div
            className="flex-1 overflow-y-auto space-y-2 min-h-0"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 #f1f1f1',
            }}
          >
            {availableTransformerIds.length === 0 ? (
              <p className="text-gray-500 text-sm">All transformers in use</p>
            ) : (
              availableTransformerIds.map((transformerId) => {
                const transformer = transformers[transformerId];

                return (
                  <TransformerItem
                    key={transformerId}
                    transformer={transformer}
                    isSelected={false}
                    handleTransformerSelect={handleTransformerSelect}
                    index={availableTransformerIds.length}
                    isInPipeline={false}
                    onAddTransformer={onAddTransformer}
                    onRemoveTransformer={onRemoveTransformer}
                    onParameterChange={handleParameterChange}
                    onParameterReset={handleParameterReset}
                    currentParameters={
                      transformerParameters[transformerId] ?? {
                        dimensions: {
                          primary: String(
                            transformer.defaultPrimaryDimension ?? '',
                          ),
                          secondary: String(
                            transformer.defaultSecondaryDimension ?? '',
                          ),
                        },
                        visual: {},
                      }
                    }
                    isVisualizing={isVisualizing}
                    lastRunParameters={lastRunParameters?.[transformerId]}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Bottom-Right: Pipeline Output */}
        <div className="border rounded-lg p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700">
              Pipeline Output
              {pipelineResult && activeTransformerIds.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  (Result from "
                  {transformers[
                    activeTransformerIds[activeTransformerIds.length - 1]
                  ].name ||
                    activeTransformerIds[activeTransformerIds.length - 1]}
                  ")
                </span>
              )}
            </h4>
            {pipelineResult && (
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(
                    JSON.stringify(pipelineResult, null, 2),
                  );
                }}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                title="Copy as JSON"
              >
                Copy JSON
              </button>
            )}
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            {pipelineResult ? (
              <div
                className="h-full border rounded bg-gray-50"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#888 #f1f1f1',
                  overflow: 'auto',
                  overflowX: 'auto',
                  overflowY: 'auto',
                }}
              >
                <ReactJson
                  src={pipelineResult}
                  theme="rjv-default"
                  style={{
                    backgroundColor: 'transparent',
                    fontSize: '11px',
                    textAlign: 'left',
                    padding: '8px',
                  }}
                  name={null}
                  collapsed={2}
                  enableClipboard={false}
                  displayDataTypes={false}
                  displayObjectSize={true}
                  indentWidth={2}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                {activeTransformerIds.length > 0
                  ? 'Click Visualize to see pipeline output'
                  : 'Add transformers and click Visualize to see output'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Status - Always visible at bottom */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border-t">
        {pipelineResult ? (
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">Pipeline Status:</span>
              <span className="ml-2 text-green-600">✓ Completed</span>
            </div>
            <div>
              <span className="font-medium">Execution Time:</span>
              <span className="ml-2">
                {pipelineResult.debug.totalExecutionTime.toFixed(2)}ms
              </span>
            </div>
            <div>
              <span className="font-medium">Transformers:</span>
              <span className="ml-2">
                {pipelineResult.debug.transformerResults.length} executed
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center">
            No pipeline results yet. Configure transformers and click Visualize.
          </div>
        )}
      </div>
    </div>
  );
}
