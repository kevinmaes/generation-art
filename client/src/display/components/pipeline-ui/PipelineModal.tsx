import React, { useEffect } from 'react';
import { PipelineManager } from './PipelineManager';
import type { PipelineResult } from '../../../transformers/types';
import type { TransformerId } from '../../../transformers/transformers';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../../../shared/types';

interface DualGedcomData {
  full: GedcomDataWithMetadata;
  llm: LLMReadyData;
}

interface PipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function PipelineModal({
  isOpen,
  onClose,
  pipelineResult,
  activeTransformerIds,
  dualData,
  onTransformerSelect,
  onAddTransformer,
  onRemoveTransformer,
  onParameterChange,
  onVisualize,
  isVisualizing,
  hasData,
  lastRunParameters,
}: PipelineModalProps): React.ReactElement {
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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
        className={`fixed top-0 left-0 h-full z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '50vw' }}
      >
        <div className="flex flex-col h-full">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <h2 className="text-xl font-semibold">Visual Transformer Pipeline</h2>
            
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

          {/* Visualize Button - positioned below header */}
          <div className="p-4 border-b bg-gray-50">
            <button
              onClick={onVisualize}
              disabled={
                !hasData || activeTransformerIds.length === 0 || isVisualizing
              }
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                isVisualizing
                  ? 'bg-blue-500 text-white'
                  : hasData && activeTransformerIds.length > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isVisualizing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Visualizing...</span>
                </div>
              ) : (
                'Visualize'
              )}
            </button>
          </div>

          {/* Panel Body - PipelineManager */}
          <div className="flex-1 overflow-hidden">
            <PipelineManager
              pipelineResult={pipelineResult}
              activeTransformerIds={activeTransformerIds}
              dualData={dualData}
              onTransformerSelect={onTransformerSelect}
              onAddTransformer={onAddTransformer}
              onRemoveTransformer={onRemoveTransformer}
              onParameterChange={onParameterChange}
              onVisualize={onVisualize}
              isVisualizing={isVisualizing}
              hasData={hasData}
              lastRunParameters={lastRunParameters}
            />
          </div>

          {/* Panel Footer with keyboard shortcuts info */}
          <div className="p-3 border-t bg-gray-50 text-sm text-gray-600">
            <div className="flex flex-col space-y-1 text-center">
              <span>
                Press{' '}
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">⌘D</kbd> to
                toggle
              </span>
              <span>
                Press{' '}
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd>{' '}
                to close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
