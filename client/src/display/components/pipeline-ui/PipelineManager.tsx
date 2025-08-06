import React, { useState } from 'react';
import { useResizeObserver } from 'usehooks-ts';
import ReactJson from 'react-json-view';
import type { PipelineResult } from '../../../transformers/types';
import { createInitialCompleteVisualMetadata } from '../../../transformers/pipeline';
import {
  transformerConfigs,
  type TransformerId,
  getTransformer,
  getTransformerIds,
  isTransformerId,
} from '../../../transformers/transformers';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../../../shared/types';
import type { VisualParameterValues } from '../../../transformers/visual-parameters';
import { TransformerItem } from './TransformerItem';
import { CollapsiblePanel } from './CollapsiblePanel';

// Accordion panel constants
const ACCORDION_PANEL_CONSTANTS = {
  AVAILABLE_TRANSFORMERS: {
    MIN_WIDTH: 360,
    MAX_HEIGHT: 350,
  },
  PIPELINE_INPUT: {
    MIN_WIDTH: 360,
    MAX_HEIGHT: 350,
  },
  PIPELINE_OUTPUT: {
    MIN_WIDTH: 360,
    MAX_HEIGHT: 350,
  },
  ACTIVE_PIPELINE: {
    MIN_WIDTH: 360,
    MAX_HEIGHT: 650,
  },
  GAP: 20, // Gap between columns in 2-column layout
} as const;

// Type for the complete dual-data structure
interface DualGedcomData {
  full: GedcomDataWithMetadata;
  llm: LLMReadyData;
}

interface PipelineManagerProps {
  pipelineResult: PipelineResult | null;
  activeTransformerIds: TransformerId[];
  dualData?: DualGedcomData | null;
  onTransformerSelect?: (transformerId: TransformerId) => void;
  onAddTransformer?: (transformerId: TransformerId) => void;
  onRemoveTransformer?: (transformerId: TransformerId) => void;
  onParameterChange?: (
    transformerId: TransformerId,
    parameters: {
      dimensions: { primary?: string; secondary?: string };
      visual: VisualParameterValues;
    },
  ) => void;
  onVisualize?: () => void;
  isVisualizing?: boolean;
  hasData?: boolean;

  lastRunParameters?: Record<
    string,
    {
      dimensions: { primary?: string; secondary?: string };
      visual: VisualParameterValues;
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

  // Collapsible panel states
  const [
    isAvailableTransformersCollapsed,
    setIsAvailableTransformersCollapsed,
  ] = useState(false); // Open by default
  const [isPipelineInputCollapsed, setIsPipelineInputCollapsed] =
    useState(true); // Collapsed by default
  const [isPipelineOutputCollapsed, setIsPipelineOutputCollapsed] =
    useState(true); // Collapsed by default
  const [isActivePipelineCollapsed, setIsActivePipelineCollapsed] =
    useState(false); // Open by default

  // Store parameters for all transformers (persistent across pipeline changes)
  const [transformerParameters, setTransformerParameters] = React.useState<
    Record<
      string,
      {
        dimensions: { primary?: string; secondary?: string };
        visual: VisualParameterValues;
      }
    >
  >({});

  // Store expanded state for available transformers (persistent across pipeline changes)
  const [expandedTransformers, setExpandedTransformers] = React.useState<
    Record<string, boolean>
  >({});

  // Handle parameter changes (immediately apply to pipeline)
  const handleParameterChange = (
    transformerId: string,
    parameters: {
      dimensions: { primary?: string; secondary?: string };
      visual: VisualParameterValues;
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
          parameters.dimensions.primary ?? transformer.defaultPrimaryDimension,
        secondary:
          parameters.dimensions.secondary ??
          transformer.defaultSecondaryDimension,
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
        primary: transformer.defaultPrimaryDimension,
        secondary: transformer.defaultSecondaryDimension,
      },
      visual: {},
    };
    setTransformerParameters((prev) => ({
      ...prev,
      [transformerId]: defaultParameters,
    }));
    handleParameterChange(transformerId, defaultParameters);
  };

  const handleTransformerSelect = (transformerId: TransformerId) => {
    setSelectedTransformerId(transformerId);
    onTransformerSelect?.(transformerId);
  };

  // Handle toggling expanded state for available transformers
  const handleToggleExpanded = (transformerId: string) => {
    setExpandedTransformers((prev) => ({
      ...prev,
      [transformerId]: !prev[transformerId],
    }));
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

  // Calculate responsive layout breakpoint
  const containerRef = React.useRef<HTMLDivElement>(null);
  const columnRef = React.useRef<HTMLDivElement>(null);

  // Use useResizeObserver for container and column dimensions
  const containerSize = useResizeObserver({
    ref: containerRef as React.RefObject<HTMLElement>,
    box: 'border-box',
  });
  const columnSize = useResizeObserver({
    ref: columnRef as React.RefObject<HTMLElement>,
    box: 'border-box',
  });

  const containerWidth = containerSize.width ?? 0;
  const columnHeight = columnSize.height ?? 600;

  // Calculate the minimum width needed for 2 columns
  const maxAccordionWidth = Math.max(
    ACCORDION_PANEL_CONSTANTS.AVAILABLE_TRANSFORMERS.MIN_WIDTH,
    ACCORDION_PANEL_CONSTANTS.PIPELINE_INPUT.MIN_WIDTH,
    ACCORDION_PANEL_CONSTANTS.PIPELINE_OUTPUT.MIN_WIDTH,
    ACCORDION_PANEL_CONSTANTS.ACTIVE_PIPELINE.MIN_WIDTH,
  );
  const minWidthForTwoColumns =
    2 * maxAccordionWidth + ACCORDION_PANEL_CONSTANTS.GAP;
  const showTwoColumns = containerWidth >= minWidthForTwoColumns;

  // Calculate dynamic heights for sections in first column
  const calculateSectionHeight = (
    _section: 'available' | 'input' | 'output',
  ) => {
    // Count expanded sections
    const isAvailableExpanded = !isAvailableTransformersCollapsed;
    const isInputExpanded = !isPipelineInputCollapsed;
    const isOutputExpanded = !isPipelineOutputCollapsed;

    const expandedCount = [
      isAvailableExpanded,
      isInputExpanded,
      isOutputExpanded,
    ].filter(Boolean).length;

    // Header height for collapsed items
    const headerHeight = 48;

    // Use the actual measured column height
    const containerHeight = columnHeight;

    if (expandedCount === 0) {
      return undefined; // All collapsed
    }

    if (expandedCount === 3) {
      // All 3 sections expanded: each gets 1/3 of the total column height
      return Math.floor(containerHeight / 3);
    }

    if (expandedCount === 2) {
      // 2 sections expanded: each gets half of (column height - collapsed header height)
      const collapsedHeadersHeight = 1 * headerHeight; // 1 collapsed item
      const availableHeight = containerHeight - collapsedHeadersHeight;
      return Math.floor(availableHeight / 2);
    }

    if (expandedCount === 1) {
      // 1 section expanded: gets (column height - 2 collapsed header heights)
      const collapsedHeadersHeight = 2 * headerHeight; // 2 collapsed items
      const availableHeight = containerHeight - collapsedHeadersHeight;
      return availableHeight;
    }

    return 200; // Fallback
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-white p-6">
      <div
        className="flex-1 grid min-h-0 h-full"
        style={{
          gridTemplateColumns: showTwoColumns ? '1fr 1fr' : '1fr',
          gap: showTwoColumns
            ? `${String(ACCORDION_PANEL_CONSTANTS.GAP)}px`
            : 0,
        }}
      >
        {/* First Column: All sections flowing naturally with smart height constraints */}
        <div
          ref={columnRef}
          className="flex flex-col overflow-y-auto h-full"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#888 #f1f1f1',
          }}
        >
          {/* Available Transformers Panel */}
          <CollapsiblePanel
            title="Available Transformers"
            isCollapsed={isAvailableTransformersCollapsed}
            onToggle={() =>
              setIsAvailableTransformersCollapsed(
                !isAvailableTransformersCollapsed,
              )
            }
            maxHeight={calculateSectionHeight('available')}
            allowExpansion={false}
          >
            <div className="space-y-2">
              {availableTransformerIds.length === 0 ? (
                <p className="text-gray-500 text-sm">All transformers in use</p>
              ) : (
                availableTransformerIds.map((transformerId) => {
                  const transformer = transformerConfigs[transformerId];

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
                            primary: transformer.defaultPrimaryDimension,
                            secondary: transformer.defaultSecondaryDimension,
                          },
                          visual: {},
                        }
                      }
                      isVisualizing={isVisualizing}
                      lastRunParameters={lastRunParameters?.[transformerId]}
                      isExpanded={expandedTransformers[transformerId] || false}
                      onToggleExpanded={handleToggleExpanded}
                    />
                  );
                })
              )}
            </div>
          </CollapsiblePanel>

          {/* Pipeline Input Panel */}
          <CollapsiblePanel
            title="Pipeline Input"
            isCollapsed={isPipelineInputCollapsed}
            onToggle={() =>
              setIsPipelineInputCollapsed(!isPipelineInputCollapsed)
            }
            maxHeight={calculateSectionHeight('input')}
            allowExpansion={false}
            buttons={
              pipelineInput && (
                <>
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        JSON.stringify(pipelineInput, null, 2),
                      );
                    }}
                    className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded hover:bg-blue-600 transition-colors"
                    title="Copy as JSON"
                  >
                    Copy
                  </button>
                  {pipelineResult && (
                    <button
                      onClick={() => {
                        setShowDiff(!showDiff);
                      }}
                      className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded hover:bg-green-600 transition-colors"
                      title="Show diff between input and output"
                    >
                      {showDiff ? 'Diff' : 'Diff'}
                    </button>
                  )}
                </>
              )
            }
          >
            {pipelineInput ? (
              <div className="border rounded bg-gray-50 flex-1 overflow-auto min-h-0">
                <ReactJson
                  src={
                    showDiff && pipelineResult
                      ? (calculateVisualMetadataDiff(
                          pipelineInput as unknown as Record<string, unknown>,
                          pipelineResult.visualMetadata as unknown as Record<
                            string,
                            unknown
                          >,
                        ) ?? {})
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
          </CollapsiblePanel>

          {/* Pipeline Output Panel */}
          <CollapsiblePanel
            title="Pipeline Output"
            isCollapsed={isPipelineOutputCollapsed}
            onToggle={() =>
              setIsPipelineOutputCollapsed(!isPipelineOutputCollapsed)
            }
            maxHeight={calculateSectionHeight('output')}
            allowExpansion={false}
            buttons={
              pipelineResult && (
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      JSON.stringify(pipelineResult, null, 2),
                    );
                  }}
                  className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded hover:bg-green-600 transition-colors"
                  title="Copy as JSON"
                >
                  Copy
                </button>
              )
            }
          >
            {pipelineResult ? (
              <div className="border rounded bg-gray-50 flex-1 overflow-auto min-h-0">
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
          </CollapsiblePanel>

          {/* Active Pipeline in single column layout */}
          {!showTwoColumns && (
            <CollapsiblePanel
              title={`Active Pipeline (${String(activeTransformerIds.length)})`}
              subtitle={
                pipelineResult
                  ? `✓ Completed - ${pipelineResult.debug.totalExecutionTime.toFixed(2)}ms`
                  : activeTransformerIds.length > 0
                    ? 'Ready to visualize'
                    : undefined
              }
              isCollapsed={isActivePipelineCollapsed}
              onToggle={() =>
                setIsActivePipelineCollapsed(!isActivePipelineCollapsed)
              }
              maxHeight={calculateSectionHeight('available')}
              allowExpansion={false}
            >
              <div className="space-y-2">
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
                              primary: transformer.defaultPrimaryDimension,
                              secondary: transformer.defaultSecondaryDimension,
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
            </CollapsiblePanel>
          )}
        </div>

        {/* Active Pipeline - conditionally in second column */}
        {showTwoColumns && (
          <div
            className="overflow-y-auto flex flex-col"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 #f1f1f1',
            }}
          >
            <CollapsiblePanel
              title={`Active Pipeline (${String(activeTransformerIds.length)})`}
              subtitle={
                pipelineResult
                  ? `✓ Completed - ${pipelineResult.debug.totalExecutionTime.toFixed(2)}ms`
                  : activeTransformerIds.length > 0
                    ? 'Ready to visualize'
                    : undefined
              }
              isCollapsed={isActivePipelineCollapsed}
              onToggle={() =>
                setIsActivePipelineCollapsed(!isActivePipelineCollapsed)
              }
              maxHeight={undefined}
              allowExpansion={true}
            >
              <div className="space-y-2">
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
                              primary: transformer.defaultPrimaryDimension,
                              secondary: transformer.defaultSecondaryDimension,
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
            </CollapsiblePanel>
          </div>
        )}
      </div>

      {/* Footer with Status and Visualize Button */}
      <div className="mt-4 p-3 bg-gray-50 border-t">
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
            {/* Visualize Button */}
            <button
              onClick={onVisualize}
              disabled={
                !hasData || activeTransformerIds.length === 0 || isVisualizing
              }
              className={`px-4 py-2 rounded font-medium transition-colors ${
                isVisualizing
                  ? 'bg-blue-500 text-white'
                  : hasData && activeTransformerIds.length > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={{ width: '250px' }}
            >
              {isVisualizing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Visualizing...</span>
                </div>
              ) : (
                'Generate art'
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 text-left">
              No pipeline results yet. Configure transformers and click
              Visualize.
            </div>
            <div></div> {/* Empty spacer */}
            {/* Visualize Button */}
            <button
              onClick={onVisualize}
              disabled={
                !hasData || activeTransformerIds.length === 0 || isVisualizing
              }
              className={`px-4 py-2 rounded font-medium transition-colors ${
                isVisualizing
                  ? 'bg-blue-500 text-white'
                  : hasData && activeTransformerIds.length > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={{ width: '250px' }}
            >
              {isVisualizing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Visualizing...</span>
                </div>
              ) : (
                'Generate art'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
