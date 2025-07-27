import React, { useState } from 'react';
import type { PipelineResult } from '../../../transformers/pipeline';
import { transformers } from '../../../transformers/transformers';

interface PipelineManagerProps {
  pipelineResult: PipelineResult | null;
  activeTransformerIds: string[];
  onTransformerSelect?: (transformerId: string) => void;
}

export function PipelineManager({
  pipelineResult,
  activeTransformerIds,
  onTransformerSelect,
}: PipelineManagerProps): React.ReactElement {
  const [selectedTransformerId, setSelectedTransformerId] = useState<
    string | null
  >(activeTransformerIds[0] ?? null);

  const handleTransformerSelect = (transformerId: string) => {
    setSelectedTransformerId(transformerId);
    onTransformerSelect?.(transformerId);
  };

  const selectedTransformer = selectedTransformerId
    ? transformers[selectedTransformerId]
    : null;

  const availableTransformerIds = Object.keys(transformers).filter(
    (id) => !activeTransformerIds.includes(id),
  );

  const formatMetadata = (data: unknown): string => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        Visual Transformer Pipeline
      </h3>

      <div className="grid grid-cols-2 gap-4" style={{ height: '500px' }}>
        {/* Top-Left: Active Pipeline */}
        <div className="border rounded-lg p-4 flex flex-col">
          <h4 className="font-medium mb-3 text-gray-700">Active Pipeline</h4>
          <div className="flex-1 overflow-y-auto space-y-2">
            {activeTransformerIds.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No transformers in pipeline
              </p>
            ) : (
              activeTransformerIds.map((transformerId, index) => {
                const transformer = transformers[transformerId];
                const isSelected = selectedTransformerId === transformerId;

                return (
                  <div
                    key={transformerId}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-purple-100 border-purple-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      handleTransformerSelect(transformerId);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm">
                          {transformer.name || transformerId}
                        </span>
                      </div>
                      <button
                        className="text-gray-400 hover:text-red-500 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          /* TODO: Implement remove functionality */
                        }}
                      >
                        ×
                      </button>
                    </div>
                    {transformer.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {transformer.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top-Right: Input Metadata */}
        <div className="border rounded-lg p-4 flex flex-col">
          <h4 className="font-medium mb-3 text-gray-700">
            Input Metadata
            {selectedTransformer && ` - ${selectedTransformer.name}`}
          </h4>
          <div className="flex-1 overflow-hidden" style={{ height: '180px' }}>
            {selectedTransformer ? (
              <div
                className="h-full overflow-auto border rounded bg-gray-50"
                style={{ scrollbarWidth: 'thin' }}
              >
                <pre className="text-xs p-2 m-0 text-left whitespace-pre font-mono">
                  <code>{formatMetadata(pipelineResult?.config ?? {})}</code>
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Select a transformer to view input metadata
              </div>
            )}
          </div>
        </div>

        {/* Bottom-Left: Available Transformers */}
        <div className="border rounded-lg p-4 flex flex-col">
          <h4 className="font-medium mb-3 text-gray-700">
            Available Transformers
          </h4>
          <div className="flex-1 overflow-y-auto space-y-2">
            {availableTransformerIds.length === 0 ? (
              <p className="text-gray-500 text-sm">All transformers in use</p>
            ) : (
              availableTransformerIds.map((transformerId) => {
                const transformer = transformers[transformerId];

                return (
                  <div
                    key={transformerId}
                    className="p-3 rounded border bg-gray-50 border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                          onClick={() => {
                            /* TODO: Implement add functionality */
                          }}
                        >
                          +
                        </button>
                        <span className="font-medium text-sm">
                          {transformer.name || transformerId}
                        </span>
                      </div>
                    </div>
                    {transformer.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {transformer.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom-Right: Output Metadata */}
        <div className="border rounded-lg p-4 flex flex-col">
          <h4 className="font-medium mb-3 text-gray-700">
            Output Metadata
            {selectedTransformer && ` - ${selectedTransformer.name}`}
          </h4>
          <div className="flex-1 overflow-hidden">
            {selectedTransformer && pipelineResult ? (
              <div
                className="h-full overflow-auto border rounded bg-gray-50"
                style={{ scrollbarWidth: 'thin', maxHeight: '180px' }}
              >
                <pre
                  className="text-xs p-2 m-0 text-left whitespace-pre font-mono"
                  style={{ maxHeight: '100%' }}
                >
                  <code>{formatMetadata(pipelineResult.visualMetadata)}</code>
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                {selectedTransformer
                  ? 'Run pipeline to see output metadata'
                  : 'Select a transformer to view output metadata'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Status */}
      {pipelineResult && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">Pipeline Status:</span>
              <span className="ml-2 text-green-600">✓ Completed</span>
            </div>
            <div>
              <span className="font-medium">Execution Time:</span>
              <span className="ml-2">
                {pipelineResult.executionTime.toFixed(2)}ms
              </span>
            </div>
            <div>
              <span className="font-medium">Transformers:</span>
              <span className="ml-2">
                {pipelineResult.transformerResults.length} executed
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
