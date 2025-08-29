import React, { useState } from 'react';
import { useResizeObserver } from 'usehooks-ts';
import ReactJson from 'react-json-view';
import type {
  PipelineResult,
  VisualTransformerConfig,
} from '../../pipeline/types';
import { createInitialCompleteVisualMetadata } from '../../pipeline/pipeline';
import { CANVAS_DIMENSIONS } from '../../../../shared/constants';
import {
  transformerConfigs,
  type TransformerId,
  getTransformer,
  getTransformerIds,
  isTransformerId,
} from '../../pipeline/transformers';
import { GripVertical } from 'lucide-react';
import { PrimaryIndividualSelector } from '../PrimaryIndividualSelector';
import { useFamilyTreeData } from '../../contexts/FamilyTreeContext';
import type { VisualParameterValues } from '../../pipeline/visual-parameters';
import { DraggableTransformerItem } from './DraggableTransformerItem';
import { SortableTransformerItem } from './SortableTransformerItem';
import { DroppablePipeline } from './DroppablePipeline';
import { CollapsiblePanel } from './CollapsiblePanel';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { usePipelineContext } from '../../hooks/usePipelineContext';

// Type definitions for drag data
interface PipelineTransformerDragData {
  type: 'pipeline-transformer';
  transformer: VisualTransformerConfig;
  index: number;
  transformerId: TransformerId;
}

interface TransformerDragData {
  type: 'transformer';
  transformer: VisualTransformerConfig;
  fromAvailable: boolean;
}

type DragData = PipelineTransformerDragData | TransformerDragData;
import {
  reorderWithCompoundUnits,
  hasVarianceAttached,
  getTransformerParameterKey,
} from '../../utils/pipeline-index';

// Drag handle configuration (matching SortableTransformerItem)
const DRAG_HANDLE_ROWS = 2;

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

interface PipelineManagerProps {
  pipelineResult: PipelineResult | null;
  activeTransformerIds: TransformerId[];
  primaryIndividualId?: string;
  onPrimaryIndividualChange?: (individualId: string | undefined) => void;
  onTransformerSelect?: (transformerId: TransformerId) => void;
  onAddTransformer?: (transformerId: TransformerId) => void;
  onRemoveTransformer?: (transformerId: TransformerId) => void;
  onReorderTransformers?: (newOrder: TransformerId[]) => void;
  onParameterChange?: (
    parameterKey: string,
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
  primaryIndividualId,
  onPrimaryIndividualChange,
  onTransformerSelect,
  onAddTransformer,
  onRemoveTransformer,
  onReorderTransformers,
  onParameterChange,
  onVisualize,
  isVisualizing = false,
  hasData = false,
  lastRunParameters,
}: PipelineManagerProps): React.ReactElement {
  const familyTreeData = useFamilyTreeData();

  const [showDiff, setShowDiff] = React.useState(false);
  const [selectedTransformerId, setSelectedTransformerId] =
    useState<TransformerId | null>(activeTransformerIds[0] ?? null);

  // Drag and drop state and onVisualize from context
  const {
    draggedItem,
    setDraggedItem,
    previewIndex,
    setPreviewIndex,
    onVisualize: contextOnVisualize,
    setDualData,
    transformerParameters,
    onParameterChange: contextOnParameterChange,
    onParameterReset: contextOnParameterReset,
  } = usePipelineContext();

  // Debug: Log what we're getting
  console.log('[DEBUG] PipelineManager - contextOnVisualize: defined');
  console.log(
    '[DEBUG] PipelineManager - prop onVisualize:',
    onVisualize ? 'defined' : 'undefined',
  );

  // Use context's onVisualize (always defined)
  const handleVisualize = contextOnVisualize;
  console.log('[DEBUG] PipelineManager - using handleVisualize: from context');

  // Set dual data in context when data becomes available
  // Track the actual data references to avoid unnecessary updates
  const prevDataRef = React.useRef<typeof familyTreeData>(null);
  React.useEffect(() => {
    // Only update if the actual data references have changed
    if (
      familyTreeData?.full !== prevDataRef.current?.full ||
      familyTreeData?.llm !== prevDataRef.current?.llm
    ) {
      console.log(
        '[DEBUG] PipelineManager - data references changed, updating context',
      );
      console.log('[DEBUG] PipelineManager - familyTreeData structure:', {
        hasFull: !!familyTreeData?.full,
        hasLlm: !!familyTreeData?.llm,
        fullType: typeof familyTreeData?.full,
        llmType: typeof familyTreeData?.llm,
      });
      if (familyTreeData) {
        console.log('[DEBUG] Setting dualData with proper structure');
        setDualData({
          full: familyTreeData.full,
          llm: familyTreeData.llm,
        });
      } else {
        setDualData(null);
      }
      prevDataRef.current = familyTreeData;
    }
  }, [familyTreeData, setDualData]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activating
      },
    }),
  );

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

  // Using transformerParameters from context instead of local state

  // Store expanded state for available transformers (persistent across pipeline changes)
  const [expandedTransformers, setExpandedTransformers] = React.useState<
    Record<string, boolean>
  >({});

  // Handle parameter changes (use context function)
  const handleParameterChange = (
    parameterKey: string,
    parameters: {
      dimensions: { primary?: string; secondary?: string };
      visual: VisualParameterValues;
    },
  ) => {
    console.log(
      '[DEBUG] PipelineManager.handleParameterChange called',
      '| parameterKey:',
      parameterKey,
      '| parameters:',
      parameters,
    );

    // Use context's onParameterChange which stores in context state
    contextOnParameterChange(parameterKey as TransformerId, parameters);

    // Also call the prop if provided (for external tracking)
    onParameterChange?.(parameterKey, parameters);
  };

  const handleParameterReset = (parameterKey: string) => {
    console.log(
      '[DEBUG] PipelineManager.handleParameterReset called',
      '| parameterKey:',
      parameterKey,
    );

    // Use context's onParameterReset
    contextOnParameterReset(parameterKey as TransformerId);
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

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Get the transformer ID from the drag data, not the sortable ID
    let transformerId: string;
    let fromAvailable = false;
    let originalIndex: number | undefined;

    const dragData = active.data.current as DragData | undefined;

    if (dragData?.type === 'pipeline-transformer') {
      // Dragging from pipeline - get transformer ID from data
      transformerId = dragData.transformerId;
      fromAvailable = false;
      originalIndex = dragData.index;
    } else if (dragData?.type === 'transformer') {
      // Dragging from available transformers
      transformerId = dragData.transformer.id;
      fromAvailable = true;
    } else {
      // Fallback to using the ID directly (for backward compatibility)
      transformerId = active.id as string;
      fromAvailable = !activeTransformerIds.includes(
        transformerId as TransformerId,
      );
    }

    // Validate that the dragged item has a valid transformer ID
    if (!isTransformerId(transformerId)) {
      console.warn('Invalid transformer ID during drag:', transformerId);
      return;
    }

    setDraggedItem({
      id: transformerId,
      fromAvailable,
      originalIndex,
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (!over || !draggedItem) {
      setPreviewIndex(null);
      return;
    }

    const overId = over.id as string;

    // Calculate preview index based on where we're hovering
    if (overId === 'active-pipeline-dropzone') {
      // Dropping at the end when over the dropzone itself
      if (draggedItem.fromAvailable) {
        setPreviewIndex(activeTransformerIds.length);
      } else {
        setPreviewIndex(null);
      }
    } else if (overId.startsWith('pipeline-')) {
      // Extract the index from the sortable ID
      const overIndex = parseInt(overId.replace('pipeline-', ''), 10);
      if (!isNaN(overIndex)) {
        // Calculate where this item would be placed
        if (draggedItem.fromAvailable) {
          // Adding new item - show position where it will be inserted
          // When hovering over an item, show insertion point before it
          setPreviewIndex(overIndex);
        } else if (draggedItem.originalIndex !== undefined) {
          // Moving existing item - calculate adjusted position
          if (overIndex > draggedItem.originalIndex) {
            setPreviewIndex(overIndex + 1);
          } else {
            setPreviewIndex(overIndex);
          }
        }
      }
    } else {
      setPreviewIndex(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Always reset drag state first
    setDraggedItem(null);
    setPreviewIndex(null);

    // If not dropped on anything, don't do anything
    if (!over || !draggedItem) {
      return;
    }

    const overId = over.id as string;

    // Check if this is a valid drop target for items from available transformers
    const isValidPipelineTarget =
      overId === 'active-pipeline-dropzone' || overId.startsWith('pipeline-');

    // If dragging from available and not dropped on pipeline, return early
    if (draggedItem.fromAvailable && !isValidPipelineTarget) {
      return;
    }

    // Get the transformer ID from the drag data, not the sortable ID
    let activeId: string;

    const dragData = active.data.current as DragData | undefined;

    if (dragData?.type === 'pipeline-transformer') {
      // Dragging from pipeline - get transformer ID from data
      activeId = dragData.transformerId;
    } else if (dragData?.type === 'transformer') {
      // Dragging from available transformers
      activeId = dragData.transformer.id;
    } else {
      // Fallback to using the ID directly (for backward compatibility)
      activeId = active.id as string;
    }

    // Validate that the active item has a valid transformer ID
    if (!isTransformerId(activeId)) {
      console.warn('Invalid transformer ID during drag end:', activeId);
      return;
    }

    // Only process drops on valid pipeline targets
    if (draggedItem.fromAvailable) {
      // Adding from available transformers - only allow on pipeline dropzone or pipeline items
      if (overId === 'active-pipeline-dropzone') {
        // Drop at the end of the pipeline
        onAddTransformer?.(activeId);
      } else if (overId.startsWith('pipeline-')) {
        // Insert at a specific position
        const overIndex = parseInt(overId.split('-')[1]);
        const newOrder = [...activeTransformerIds];
        newOrder.splice(overIndex, 0, activeId);
        onReorderTransformers?.(newOrder);
      }
    } else {
      // Reordering within pipeline - only allow on pipeline items
      if (overId.startsWith('pipeline-')) {
        const overIndex = parseInt(overId.split('-')[1]);
        const activeIndex = activeTransformerIds.indexOf(activeId);

        if (activeIndex !== -1 && activeIndex !== overIndex) {
          // Use compound drag logic to move transformer with its variance if attached
          const newOrder = reorderWithCompoundUnits(
            activeTransformerIds,
            activeIndex,
            overIndex,
          );
          onReorderTransformers?.(newOrder);
        }
      }
      // If dropped anywhere else, item returns to its original position
    }
  };

  // Note: selectedTransformer is no longer used since we show complete pipeline data

  const availableTransformerIds: TransformerId[] = getTransformerIds().filter(
    (id) => !activeTransformerIds.includes(id) && id !== 'variance',
  );

  // Memoize the pipeline input to avoid expensive recalculations
  const pipelineInput = React.useMemo(() => {
    if (!familyTreeData || activeTransformerIds.length === 0) {
      return null;
    }

    return {
      fullData: familyTreeData.full,
      llmData: familyTreeData.llm,
      visualMetadata: createInitialCompleteVisualMetadata(
        familyTreeData.full,
        CANVAS_DIMENSIONS.WEB.WIDTH, // Default canvas width
        CANVAS_DIMENSIONS.WEB.HEIGHT, // Default canvas height
      ),
      config: {
        transformerIds: activeTransformerIds,
        temperature: 0.5, // Default temperature
        canvasWidth: 800, // Default canvas width
        canvasHeight: 600, // Default canvas height
      },
    };
  }, [familyTreeData, activeTransformerIds]); // Only recalculate when data or transformer list changes

  const visiblePipelineCount = React.useMemo(() => {
    return activeTransformerIds.filter((id) => id !== 'variance').length;
  }, [activeTransformerIds]);

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
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
            {/* Primary Individual Selector */}
            {familyTreeData && (
              <div className="mb-4">
                <PrimaryIndividualSelector
                  gedcomData={familyTreeData.full}
                  value={primaryIndividualId}
                  onChange={onPrimaryIndividualChange ?? (() => undefined)}
                />
              </div>
            )}

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
                  <p className="text-gray-500 text-sm">
                    All transformers in use
                  </p>
                ) : (
                  availableTransformerIds
                    .map((transformerId) => {
                      const transformer = transformerConfigs[transformerId];

                      return (
                        <DraggableTransformerItem
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
                                secondary:
                                  transformer.defaultSecondaryDimension,
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
                    .filter(Boolean)
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
                  {familyTreeData
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
                title={`Active Pipeline (${String(visiblePipelineCount)})`}
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
                <DroppablePipeline
                  activeTransformerIds={activeTransformerIds}
                  draggedOverIndex={previewIndex}
                  isDraggingFromAvailable={draggedItem?.fromAvailable}
                >
                  {activeTransformerIds.map((transformerId, index) => {
                    const transformer = getTransformer(transformerId);
                    const isSelected = selectedTransformerId === transformerId;
                    const parameterKey = getTransformerParameterKey(
                      activeTransformerIds,
                      index,
                    );


                    return (
                      <SortableTransformerItem
                        key={`${transformerId}-${String(index)}`}
                        transformer={transformer}
                        isSelected={isSelected}
                        handleTransformerSelect={handleTransformerSelect}
                        index={index}
                        onAddTransformer={onAddTransformer}
                        onRemoveTransformer={onRemoveTransformer}
                        onParameterChange={handleParameterChange}
                        onParameterReset={handleParameterReset}
                        currentParameters={
                          transformerParameters[parameterKey] ?? {
                            dimensions: {
                              primary: transformer.defaultPrimaryDimension,
                              secondary: transformer.defaultSecondaryDimension,
                            },
                            visual: {},
                          }
                        }
                        isVisualizing={isVisualizing}
                        lastRunParameters={lastRunParameters?.[parameterKey]}
                        parameterKey={parameterKey}
                      />
                    );
                  })}
                </DroppablePipeline>
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
                title={`Active Pipeline (${String(visiblePipelineCount)})`}
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
                <DroppablePipeline
                  activeTransformerIds={activeTransformerIds}
                  draggedOverIndex={previewIndex}
                  isDraggingFromAvailable={draggedItem?.fromAvailable}
                >
                  {activeTransformerIds.map((transformerId, index) => {
                    const transformer = getTransformer(transformerId);
                    const isSelected = selectedTransformerId === transformerId;
                    const parameterKey = getTransformerParameterKey(
                      activeTransformerIds,
                      index,
                    );


                    return (
                      <SortableTransformerItem
                        key={`${transformerId}-${String(index)}`}
                        transformer={transformer}
                        isSelected={isSelected}
                        handleTransformerSelect={handleTransformerSelect}
                        index={index}
                        onAddTransformer={onAddTransformer}
                        onRemoveTransformer={onRemoveTransformer}
                        onParameterChange={handleParameterChange}
                        onParameterReset={handleParameterReset}
                        currentParameters={
                          transformerParameters[parameterKey] ?? {
                            dimensions: {
                              primary: transformer.defaultPrimaryDimension,
                              secondary: transformer.defaultSecondaryDimension,
                            },
                            visual: {},
                          }
                        }
                        isVisualizing={isVisualizing}
                        lastRunParameters={lastRunParameters?.[parameterKey]}
                        parameterKey={parameterKey}
                      />
                    );
                  })}
                </DroppablePipeline>
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
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log(
                    '[DEBUG] Generate button clicked, calling handleVisualize',
                  );
                  void handleVisualize();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={
                  !hasData ||
                  activeTransformerIds.length === 0 ||
                  isVisualizing ||
                  !primaryIndividualId
                }
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  isVisualizing
                    ? 'bg-blue-500 text-white'
                    : hasData &&
                        activeTransformerIds.length > 0 &&
                        primaryIndividualId
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={{ width: '250px' }}
                title={
                  !primaryIndividualId
                    ? 'Please select a primary individual'
                    : undefined
                }
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
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log(
                    '[DEBUG] Generate button clicked, calling handleVisualize',
                  );
                  void handleVisualize();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={
                  !hasData ||
                  activeTransformerIds.length === 0 ||
                  isVisualizing ||
                  !primaryIndividualId
                }
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  isVisualizing
                    ? 'bg-blue-500 text-white'
                    : hasData &&
                        activeTransformerIds.length > 0 &&
                        primaryIndividualId
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={{ width: '250px' }}
                title={
                  !primaryIndividualId
                    ? 'Please select a primary individual'
                    : undefined
                }
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

        <DragOverlay dropAnimation={null}>
          {draggedItem && isTransformerId(draggedItem.id)
            ? (() => {
                // Check if this transformer has variance attached (only if dragging from pipeline)
                const showVariance =
                  !draggedItem.fromAvailable &&
                  draggedItem.originalIndex !== undefined &&
                  hasVarianceAttached(
                    activeTransformerIds,
                    draggedItem.originalIndex,
                  );

                return (
                  <div style={{ width: '100%' }}>
                    {/* Main transformer */}
                    <div
                      className={`bg-gray-50 border border-gray-200 ${showVariance ? 'rounded-t border-b-0' : 'rounded'} shadow-lg`}
                    >
                      <div className="flex items-center px-2 pt-3 pb-2">
                        {/* Drag handle preview */}
                        <div
                          className="text-gray-400 flex flex-col items-center justify-center min-w-6 mr-2"
                          style={{
                            height: `${String(DRAG_HANDLE_ROWS * 16)}px`,
                          }}
                        >
                          {Array.from({ length: DRAG_HANDLE_ROWS }, (_, i) => (
                            <GripVertical
                              key={i}
                              size={12}
                              className="leading-none"
                            />
                          ))}
                        </div>
                        {/* Transformer content - matching TransformerItem structure */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded">
                              {previewIndex ??
                                (draggedItem.fromAvailable ? 'A' : 'P')}
                            </span>
                            <span className="font-medium text-sm truncate">
                              {transformerConfigs[draggedItem.id].name ||
                                draggedItem.id}
                            </span>
                          </div>
                          {transformerConfigs[draggedItem.id]
                            .shortDescription && (
                            <p className="text-xs text-gray-800 font-medium mt-0.5 text-left">
                              {
                                transformerConfigs[draggedItem.id]
                                  .shortDescription
                              }
                            </p>
                          )}

                          {/* Parameters section placeholder to match height */}
                          {!draggedItem.fromAvailable && (
                            <div className="mt-2">
                              <div className="px-4 py-2 bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs">▶</span>
                                  <span className="text-xs font-medium text-gray-700">
                                    Parameters
                                  </span>
                                </div>
                                <button className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                  Reset
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Variance transformer if attached */}
                    {showVariance && (
                      <div className="bg-gray-50/70 border-x border-b border-gray-200 rounded-b shadow-lg -mt-[1px]">
                        <div className="flex items-center px-2 py-2 pl-8">
                          <div className="flex-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded">
                                {previewIndex
                                  ? `${String(previewIndex)}a`
                                  : 'Va'}
                              </span>
                              <span className="font-medium text-sm truncate">
                                Variance
                              </span>
                            </div>
                            <p className="text-xs text-gray-800 font-medium mt-0.5 text-left">
                              Add random variation to previous transformer
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
