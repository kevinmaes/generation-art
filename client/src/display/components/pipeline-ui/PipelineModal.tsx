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
}: PipelineModalProps): React.ReactElement | null {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full h-full max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] m-4 bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b relative">
          <h2 className="text-xl font-semibold">Visual Transformer Pipeline</h2>

          {/* Centered Visualize Button */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <button
              onClick={onVisualize}
              disabled={
                !hasData || activeTransformerIds.length === 0 || isVisualizing
              }
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isVisualizing
                  ? 'bg-blue-500 text-white'
                  : hasData && activeTransformerIds.length > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isVisualizing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Visualizing...</span>
                </div>
              ) : (
                'Visualize'
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
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

        {/* Modal Body - PipelineManager */}
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

        {/* Modal Footer with keyboard shortcuts info */}
        <div className="p-3 border-t bg-gray-50 text-sm text-gray-600 flex justify-center items-center">
          <div className="flex space-x-4">
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
  );
}
