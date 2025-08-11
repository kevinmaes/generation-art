import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEventListener, useWindowSize, useMediaQuery } from 'usehooks-ts';
import { PipelineManager } from './PipelineManager';
import type { PipelineResult } from '../../transformers/types';
import type { TransformerId } from '../../transformers/transformers';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../../shared/types';
import type { VisualParameterValues } from '../../transformers/visual-parameters';

// Panel width constants
const PANEL_WIDTH_CONSTANTS = {
  MIN_WIDTH: 320, // Minimum width in pixels - enough for first column
  MAX_WIDTH_VW: 80, // Maximum width as viewport width percentage
  DEFAULT_WIDTH_VW: 50, // Default width as viewport width percentage
  DRAG_HANDLE_WIDTH: 8, // Width of the drag handle in pixels
} as const;

interface DualGedcomData {
  full: GedcomDataWithMetadata;
  llm: LLMReadyData;
}

interface PipelinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineResult: PipelineResult | null;
  activeTransformerIds: TransformerId[];
  dualData?: DualGedcomData | null;
  onTransformerSelect?: (transformerId: TransformerId) => void;
  onAddTransformer?: (transformerId: TransformerId) => void;
  onRemoveTransformer?: (transformerId: TransformerId) => void;
  onReorderTransformers?: (newOrder: TransformerId[]) => void;
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

export function PipelinePanel({
  isOpen,
  onClose,
  pipelineResult,
  activeTransformerIds,
  dualData,
  onTransformerSelect,
  onAddTransformer,
  onRemoveTransformer,
  onReorderTransformers,
  onParameterChange,
  onVisualize,
  isVisualizing,
  hasData,
  lastRunParameters,
}: PipelinePanelProps): React.ReactElement {
  const { width: windowWidth } = useWindowSize();
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    // Initialize with default width in pixels
    return (windowWidth * PANEL_WIDTH_CONSTANTS.DEFAULT_WIDTH_VW) / 100;
  });
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(0);

  // Use media query for responsive behavior
  const isNarrowViewport = useMediaQuery('(max-width: 768px)');

  // Handle keyboard shortcuts
  useEventListener('keydown', (event: KeyboardEvent) => {
    // Handle Escape key
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }

    // Handle Cmd+D or Ctrl+D
    if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
      event.preventDefault(); // Prevent browser bookmark
      if (isOpen) {
        onClose();
      }
    }
  });

  // Handle window resize - using windowWidth from useWindowSize
  useEffect(() => {
    // Ensure panel width stays within bounds when window resizes
    const newMaxWidth =
      (windowWidth * PANEL_WIDTH_CONSTANTS.MAX_WIDTH_VW) / 100;
    setPanelWidth((prevWidth) => {
      if (prevWidth > newMaxWidth) {
        return newMaxWidth;
      }
      return Math.max(prevWidth, PANEL_WIDTH_CONSTANTS.MIN_WIDTH);
    });
  }, [windowWidth]);

  // Mouse event handlers for resizing
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartX.current = e.clientX;
      dragStartWidth.current = panelWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    },
    [panelWidth],
  );

  useEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX.current;
    const newWidth = dragStartWidth.current + deltaX;
    const currentMaxWidth =
      (windowWidth * PANEL_WIDTH_CONSTANTS.MAX_WIDTH_VW) / 100;

    // Clamp width between min and max
    const clampedWidth = Math.max(
      PANEL_WIDTH_CONSTANTS.MIN_WIDTH,
      Math.min(newWidth, currentMaxWidth),
    );

    setPanelWidth(clampedWidth);
  });

  useEventListener('mouseup', () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  // Determine if panel is narrow (for responsive layout)
  // Combine panel width check with viewport width check for better responsiveness
  const isNarrow = panelWidth < 500 || isNarrowViewport;

  return (
    <>
      {/* Backdrop - only visible when panel is open */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-30' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 left-0 h-full z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: `${String(panelWidth)}px` }}
      >
        <div className="flex flex-col h-full">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
            <h2 className="text-xl font-semibold">
              Visual Transformer Pipeline
            </h2>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Panel Body - PipelineManager with responsive layout hint */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className={`h-full ${isNarrow ? 'narrow-layout' : ''}`}>
              <PipelineManager
                pipelineResult={pipelineResult}
                activeTransformerIds={activeTransformerIds}
                dualData={dualData}
                onTransformerSelect={onTransformerSelect}
                onAddTransformer={onAddTransformer}
                onRemoveTransformer={onRemoveTransformer}
                onReorderTransformers={onReorderTransformers}
                onParameterChange={onParameterChange}
                onVisualize={onVisualize}
                isVisualizing={isVisualizing}
                hasData={hasData}
                lastRunParameters={lastRunParameters}
              />
            </div>
          </div>

          {/* Panel Footer with keyboard shortcuts info */}
          <div className="p-3 border-t bg-gray-50 text-sm text-gray-600 flex-shrink-0">
            <div className="text-center">
              <span>
                Press{' '}
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">⌘D</kbd>{' '}
                to toggle • Press{' '}
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd>{' '}
                to close
              </span>
            </div>
          </div>
        </div>

        {/* Drag Handle */}
        <div
          className={`absolute top-0 right-0 h-full flex items-center justify-center transition-opacity ${
            isDragging ? 'opacity-100' : 'hover:opacity-100 opacity-0'
          }`}
          style={{
            width: `${String(PANEL_WIDTH_CONSTANTS.DRAG_HANDLE_WIDTH)}px`,
            cursor: 'ew-resize',
            right: `-${String(PANEL_WIDTH_CONSTANTS.DRAG_HANDLE_WIDTH / 2)}px`,
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="h-24 w-1 bg-gray-400 rounded-full" />
        </div>
      </div>
    </>
  );
}
