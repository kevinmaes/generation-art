import React, { useState } from 'react';
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

// Accordion panel constants
const ACCORDION_PANEL_CONSTANTS = {
  AVAILABLE_TRANSFORMERS: {
    MIN_WIDTH: 350,
    MAX_HEIGHT: 350,
  },
  PIPELINE_INPUT: {
    MIN_WIDTH: 350,
    MAX_HEIGHT: 350,
  },
  PIPELINE_OUTPUT: {
    MIN_WIDTH: 350,
    MAX_HEIGHT: 350,
  },
  ACTIVE_PIPELINE: {
    MIN_WIDTH: 350,
    MAX_HEIGHT: 350,
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


  // Collapsible Panel Component with dynamic sizing
  const CollapsiblePanel: React.FC<{
    title: string;
    subtitle?: string;
    isCollapsed: boolean;
    onToggle: () => void;
    buttons?: React.ReactNode;
    children: React.ReactNode;
    hasContent?: boolean;
    maxHeight?: number;
    allowExpansion?: boolean;
  }> = ({
    title,
    subtitle,
    isCollapsed,
    onToggle,
    buttons,
    children,
    hasContent = false,
    maxHeight,
    allowExpansion = false,
  }) => (
    <div
      className="border-l border-r border-t last:border-b flex flex-col"
      style={{
        flexShrink: 0,
        ...(allowExpansion && !isCollapsed ? { flex: 1 } : {}),
      }}
    >
      {/* Clickable Header */}
      <div
        className="bg-gray-100 border-b px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors flex-shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Rotating Arrow Caret */}
          <svg
            className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 ${
              isCollapsed ? '-rotate-90' : 'rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-gray-700 truncate text-left">
              {title}
            </h4>
            {subtitle && (
              <span className="text-xs text-gray-500 truncate block text-left">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        {/* Buttons - prevent click propagation */}
        {buttons && (
          <div
            className="flex space-x-1 flex-shrink-0 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            {buttons}
          </div>
        )}
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div
          className={`overflow-auto p-4 ${allowExpansion ? 'flex-1 min-h-0' : ''}`}
          style={{
            maxHeight: hasContent && maxHeight && !allowExpansion
              ? `${String(maxHeight)}px`
              : undefined,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );

  // Calculate responsive layout breakpoint
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  
  // Calculate the minimum width needed for 2 columns
  const maxAccordionWidth = Math.max(
    ACCORDION_PANEL_CONSTANTS.AVAILABLE_TRANSFORMERS.MIN_WIDTH,
    ACCORDION_PANEL_CONSTANTS.PIPELINE_INPUT.MIN_WIDTH,
    ACCORDION_PANEL_CONSTANTS.PIPELINE_OUTPUT.MIN_WIDTH,
    ACCORDION_PANEL_CONSTANTS.ACTIVE_PIPELINE.MIN_WIDTH
  );
  const minWidthForTwoColumns = (2 * maxAccordionWidth) + ACCORDION_PANEL_CONSTANTS.GAP;
  const showTwoColumns = containerWidth >= minWidthForTwoColumns;

  // Calculate dynamic heights for open accordion items
  const calculateDynamicHeight = (isInSecondColumn = false) => {
    if (isInSecondColumn) {
      // In second column, Active Pipeline can use full height
      return undefined; // Let it expand naturally
    }

    // In first column, calculate available space
    const openAccordionCount = [
      !isAvailableTransformersCollapsed,
      !isPipelineInputCollapsed,
      !isPipelineOutputCollapsed,
      !showTwoColumns && !isActivePipelineCollapsed, // Only count if in same column
    ].filter(Boolean).length;

    if (openAccordionCount <= 1) {
      // If only one is open, it can expand more
      return undefined;
    }

    // Multiple open, use the configured max height
    return ACCORDION_PANEL_CONSTANTS.AVAILABLE_TRANSFORMERS.MAX_HEIGHT;
  };

  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-white p-6">
      <div
        className="flex-1 grid min-h-0"
        style={{
          gridTemplateColumns: showTwoColumns ? '1fr 1fr' : '1fr',
          gap: showTwoColumns ? `${String(ACCORDION_PANEL_CONSTANTS.GAP)}px` : 0,
        }}
      >
        {/* First Column: Accordion Container */}
        <div 
          className="overflow-y-auto flex flex-col"
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
            hasContent={availableTransformerIds.length > 0}
            maxHeight={calculateDynamicHeight()}
            allowExpansion={calculateDynamicHeight() === undefined}
          >
            <div className="space-y-2">
                {availableTransformerIds.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    All transformers in use
                  </p>
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
                        isExpanded={
                          expandedTransformers[transformerId] || false
                        }
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
            hasContent={!!pipelineInput}
            maxHeight={calculateDynamicHeight()}
            allowExpansion={calculateDynamicHeight() === undefined}
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
                              pipelineInput as unknown as Record<
                                string,
                                unknown
                              >,
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
            hasContent={!!pipelineResult}
            maxHeight={calculateDynamicHeight()}
            allowExpansion={calculateDynamicHeight() === undefined}
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
              subtitle={pipelineResult ? `✓ Completed - ${pipelineResult.debug.totalExecutionTime.toFixed(2)}ms` : 'Ready to visualize'}
              isCollapsed={isActivePipelineCollapsed}
              onToggle={() => setIsActivePipelineCollapsed(!isActivePipelineCollapsed)}
              hasContent={activeTransformerIds.length > 0}
              maxHeight={calculateDynamicHeight()}
              allowExpansion={calculateDynamicHeight() === undefined}
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
              subtitle={pipelineResult ? `✓ Completed - ${pipelineResult.debug.totalExecutionTime.toFixed(2)}ms` : 'Ready to visualize'}
              isCollapsed={isActivePipelineCollapsed}
              onToggle={() => setIsActivePipelineCollapsed(!isActivePipelineCollapsed)}
              hasContent={activeTransformerIds.length > 0}
              maxHeight={calculateDynamicHeight(true)}
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
            <div className="text-sm text-gray-500">
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
