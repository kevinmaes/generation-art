/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback, useMemo } from 'react';
import type { PipelineResult } from '../pipeline/types';
import type { TransformerId } from '../pipeline/transformers';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';
import type { VisualParameterValues } from '../pipeline/visual-parameters';
import { usePipeline } from '../hooks/usePipeline';
import { CANVAS_DIMENSIONS } from '../../../shared/constants';

// Type for the complete dual-data structure
export interface DualGedcomData {
  full: GedcomDataWithMetadata;
  llm: LLMReadyData;
}

// Type for transformer parameters
export interface TransformerParameterConfig {
  dimensions: { primary?: string; secondary?: string };
  visual: VisualParameterValues;
}

// Type for drag state
export interface DraggedItem {
  id: TransformerId;
  fromAvailable: boolean;
  originalIndex?: number;
}

// Type for panel collapse states
export interface PanelCollapseStates {
  availableTransformers: boolean;
  pipelineInput: boolean;
  pipelineOutput: boolean;
  activePipeline: boolean;
}

// Context value type
export interface PipelineContextValue {
  // Core data
  pipelineResult: PipelineResult | null;
  activeTransformerIds: TransformerId[];
  dualData: DualGedcomData | null;
  selectedTransformerId: TransformerId | null;

  // Pipeline execution states
  isPipelineRunning: boolean;
  pipelineError: string | null;

  // UI states
  isVisualizing: boolean;
  hasData: boolean;
  showDiff: boolean;

  // Transformer parameters
  transformerParameters: Record<string, TransformerParameterConfig>;
  lastRunParameters: Record<string, TransformerParameterConfig> | undefined;
  expandedTransformers: Record<string, boolean>;

  // Drag and drop state
  draggedItem: DraggedItem | null;
  previewIndex: number | null;

  // Panel collapse states
  panelCollapseStates: PanelCollapseStates;

  // Actions
  setPipelineResult: (result: PipelineResult | null) => void;
  setActiveTransformerIds: (ids: TransformerId[]) => void;
  setDualData: (data: DualGedcomData | null) => void;
  setSelectedTransformerId: (id: TransformerId | null) => void;
  setIsVisualizing: (visualizing: boolean) => void;
  setHasData: (has: boolean) => void;
  setShowDiff: (show: boolean) => void;

  // Transformer actions
  onTransformerSelect: (transformerId: TransformerId) => void;
  onAddTransformer: (transformerId: TransformerId) => void;
  onRemoveTransformer: (transformerId: TransformerId) => void;
  onReorderTransformers: (newOrder: TransformerId[]) => void;
  onParameterChange: (
    transformerId: TransformerId,
    parameters: TransformerParameterConfig,
  ) => void;
  onParameterReset: (transformerId: TransformerId) => void;
  onVisualize: () => Promise<void>;

  // Transformer UI actions
  setTransformerExpanded: (transformerId: string, expanded: boolean) => void;

  // Drag and drop actions
  setDraggedItem: (item: DraggedItem | null) => void;
  setPreviewIndex: (index: number | null) => void;

  // Panel collapse actions
  togglePanel: (panel: keyof PanelCollapseStates) => void;

  // Utility
  availableTransformerIds: TransformerId[];
}

// Provider props
export interface PipelineProviderProps {
  children: React.ReactNode;
  initialActiveTransformerIds?: TransformerId[];
  canvasWidth?: number;
  canvasHeight?: number;
  temperature?: number;
  seed?: string;
  onVisualize?: () => void;
  onTransformerIdsChange?: (ids: TransformerId[]) => void;
  onParameterChange?: (
    transformerId: TransformerId,
    parameters: TransformerParameterConfig,
  ) => void;
}

// Create context with undefined default
export const PipelineContext = createContext<PipelineContextValue | undefined>(
  undefined,
);

// Provider component
export function PipelineProvider({
  children,
  initialActiveTransformerIds = [],
  canvasWidth = 800,
  canvasHeight = CANVAS_DIMENSIONS.WEB.HEIGHT,
  temperature,
  seed,
  onVisualize: externalOnVisualize,
  onTransformerIdsChange,
  onParameterChange: externalOnParameterChange,
}: PipelineProviderProps) {
  // Use the pipeline hook for execution
  const {
    result: pipelineResult,
    error: pipelineError,
    isRunning: isPipelineRunning,
    runPipeline: executePipeline,
  } = usePipeline({ temperature, seed });

  // Core state
  const [activeTransformerIds, setActiveTransformerIdsState] = useState<
    TransformerId[]
  >(initialActiveTransformerIds);
  const [dualData, setDualData] = useState<DualGedcomData | null>(null);
  const [selectedTransformerId, setSelectedTransformerId] =
    useState<TransformerId | null>(initialActiveTransformerIds[0] ?? null);

  // Sync activeTransformerIds with external prop changes
  React.useEffect(() => {
    setActiveTransformerIdsState(initialActiveTransformerIds);
  }, [initialActiveTransformerIds]);

  // UI states
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Transformer parameters
  const [transformerParameters, setTransformerParameters] = useState<
    Record<string, TransformerParameterConfig>
  >({});
  const [lastRunParameters, setLastRunParameters] = useState<
    Record<string, TransformerParameterConfig> | undefined
  >();
  const [expandedTransformers, setExpandedTransformers] = useState<
    Record<string, boolean>
  >({});

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Panel collapse states
  const [panelCollapseStates, setPanelCollapseStates] =
    useState<PanelCollapseStates>({
      availableTransformers: false, // Open by default
      pipelineInput: true, // Collapsed by default
      pipelineOutput: true, // Collapsed by default
      activePipeline: false, // Open by default
    });

  // Compute available transformer IDs
  const availableTransformerIds = useMemo(() => {
    // This will be computed based on all transformer IDs minus active ones
    // For now, returning empty array - will be implemented when integrating
    return [] as TransformerId[];
  }, []);

  // Actions
  const setActiveTransformerIds = useCallback(
    (ids: TransformerId[]) => {
      setActiveTransformerIdsState(ids);
      onTransformerIdsChange?.(ids);
    },
    [onTransformerIdsChange],
  );

  const onTransformerSelect = useCallback((transformerId: TransformerId) => {
    setSelectedTransformerId(transformerId);
  }, []);

  const onAddTransformer = useCallback(
    (transformerId: TransformerId) => {
      setActiveTransformerIds([...activeTransformerIds, transformerId]);
    },
    [activeTransformerIds, setActiveTransformerIds],
  );

  const onRemoveTransformer = useCallback(
    (transformerId: TransformerId) => {
      setActiveTransformerIds(
        activeTransformerIds.filter((id) => id !== transformerId),
      );
      // Clear parameters for removed transformer
      setTransformerParameters((prev) => {
        const { [transformerId]: _, ...rest } = prev;
        return rest;
      });
    },
    [activeTransformerIds, setActiveTransformerIds],
  );

  const onReorderTransformers = useCallback(
    (newOrder: TransformerId[]) => {
      setActiveTransformerIds(newOrder);
    },
    [setActiveTransformerIds],
  );

  const onParameterChange = useCallback(
    (transformerId: TransformerId, parameters: TransformerParameterConfig) => {
      setTransformerParameters((prev) => ({
        ...prev,
        [transformerId]: parameters,
      }));
      externalOnParameterChange?.(transformerId, parameters);
    },
    [externalOnParameterChange],
  );

  const onParameterReset = useCallback((transformerId: TransformerId) => {
    setTransformerParameters((prev) => {
      const { [transformerId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const onVisualize = useCallback(async () => {
    if (!dualData || activeTransformerIds.length === 0) {
      return;
    }

    setLastRunParameters({ ...transformerParameters });
    setIsVisualizing(true);

    try {
      await executePipeline(
        dualData.full,
        dualData.llm,
        canvasWidth,
        canvasHeight,
        activeTransformerIds,
        transformerParameters,
      );
      externalOnVisualize?.();
    } finally {
      setIsVisualizing(false);
    }
  }, [
    dualData,
    activeTransformerIds,
    transformerParameters,
    executePipeline,
    canvasWidth,
    canvasHeight,
    externalOnVisualize,
  ]);

  const setTransformerExpanded = useCallback(
    (transformerId: string, expanded: boolean) => {
      setExpandedTransformers((prev) => ({
        ...prev,
        [transformerId]: expanded,
      }));
    },
    [],
  );

  const togglePanel = useCallback((panel: keyof PanelCollapseStates) => {
    setPanelCollapseStates((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }));
  }, []);

  // Context value
  const value = useMemo<PipelineContextValue>(
    () => ({
      // Core data
      pipelineResult,
      activeTransformerIds,
      dualData,
      selectedTransformerId,

      // Pipeline execution states
      isPipelineRunning,
      pipelineError,

      // UI states
      isVisualizing,
      hasData,
      showDiff,

      // Transformer parameters
      transformerParameters,
      lastRunParameters,
      expandedTransformers,

      // Drag and drop state
      draggedItem,
      previewIndex,

      // Panel collapse states
      panelCollapseStates,

      // Actions
      setPipelineResult: () => {
        // Pipeline result is now managed by usePipeline hook
        console.warn(
          'setPipelineResult is deprecated, pipeline result is managed internally',
        );
      },
      setActiveTransformerIds,
      setDualData,
      setSelectedTransformerId,
      setIsVisualizing,
      setHasData,
      setShowDiff,

      // Transformer actions
      onTransformerSelect,
      onAddTransformer,
      onRemoveTransformer,
      onReorderTransformers,
      onParameterChange,
      onParameterReset,
      onVisualize,

      // Transformer UI actions
      setTransformerExpanded,

      // Drag and drop actions
      setDraggedItem,
      setPreviewIndex,

      // Panel collapse actions
      togglePanel,

      // Utility
      availableTransformerIds,
    }),
    [
      pipelineResult,
      pipelineError,
      isPipelineRunning,
      activeTransformerIds,
      dualData,
      selectedTransformerId,
      isVisualizing,
      hasData,
      showDiff,
      transformerParameters,
      lastRunParameters,
      expandedTransformers,
      draggedItem,
      previewIndex,
      panelCollapseStates,
      availableTransformerIds,
      setActiveTransformerIds,
      onTransformerSelect,
      onAddTransformer,
      onRemoveTransformer,
      onReorderTransformers,
      onParameterChange,
      onParameterReset,
      onVisualize,
      setTransformerExpanded,
      togglePanel,
    ],
  );

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}
