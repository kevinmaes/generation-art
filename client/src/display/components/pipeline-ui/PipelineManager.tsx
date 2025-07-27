import React, { useState } from 'react';
import ReactJson from 'react-json-view';
import type { PipelineResult } from '../../../transformers/pipeline';
import { transformers } from '../../../transformers/transformers';
import type { GedcomDataWithMetadata } from '../../../../../shared/types';

interface PipelineManagerProps {
  pipelineResult: PipelineResult | null;
  activeTransformerIds: string[];
  gedcomData?: GedcomDataWithMetadata;
  onTransformerSelect?: (transformerId: string) => void;
  onVisualize?: () => void;
  isVisualizing?: boolean;
  hasData?: boolean;
}

export function PipelineManager({
  pipelineResult,
  activeTransformerIds,
  gedcomData,
  onTransformerSelect,
  onVisualize,
  isVisualizing = false,
  hasData = false,
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

  // Construct the complete PipelineInput object
  const pipelineInput =
    gedcomData && activeTransformerIds.length > 0
      ? {
          gedcomData,
          config: {
            transformerIds: activeTransformerIds,
            temperature: 0.5, // Default temperature
            canvasWidth: 800, // Default canvas width
            canvasHeight: 600, // Default canvas height
          },
        }
      : null;

  const isVisualizeEnabled =
    hasData && activeTransformerIds.length > 0 && !isVisualizing;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Visual Transformer Pipeline</h3>
        <button
          onClick={onVisualize}
          disabled={!isVisualizeEnabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isVisualizeEnabled
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
                    <div className="flex items-center w-full">
                      <div className="flex items-center space-x-2 flex-1 text-left">
                        <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm">
                          {transformer.name || transformerId}
                        </span>
                      </div>
                      <button
                        className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          /* TODO: Implement remove functionality */
                        }}
                      >
                        ×
                      </button>
                    </div>
                    {transformer.description && (
                      <p className="text-xs text-gray-600 mt-1 text-left">
                        {transformer.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top-Right: Input (data) */}
        <div className="border rounded-lg p-4 flex flex-col">
          <h4 className="font-medium mb-3 text-gray-700">
            Input
            {selectedTransformer && ` - ${selectedTransformer.name}`}
          </h4>
          <div className="flex-1 overflow-hidden" style={{ height: '180px' }}>
            {pipelineInput ? (
              <div
                className="h-full border rounded bg-gray-50"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#888 #f1f1f1',
                  overflow: 'auto',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxHeight: '180px',
                }}
              >
                <ReactJson
                  src={pipelineInput}
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
                {hasData
                  ? 'Select transformers to see pipeline input'
                  : 'Load data to view pipeline input'}
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
                    <div className="flex items-center w-full">
                      <div className="flex items-center space-x-2 flex-1 text-left">
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
                      <p className="text-xs text-gray-600 mt-1 text-left">
                        {transformer.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom-Right: Output (data) */}
        <div className="border rounded-lg p-4 flex flex-col">
          <h4 className="font-medium mb-3 text-gray-700">
            Output
            {selectedTransformer && ` - ${selectedTransformer.name}`}
          </h4>
          <div className="flex-1 overflow-hidden" style={{ height: '180px' }}>
            {selectedTransformer && pipelineResult ? (
              <div
                className="h-full border rounded bg-gray-50"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#888 #f1f1f1',
                  overflow: 'auto',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxHeight: '180px',
                }}
              >
                <ReactJson
                  src={pipelineResult.visualMetadata}
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
                {selectedTransformer
                  ? 'Run pipeline to see output metadata'
                  : 'Click Visualize to flow data through the pipeline'}
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
