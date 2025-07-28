import React from 'react';
import type { VisualTransformerConfig } from '../../../transformers/types';

interface TransformerItemProps {
  transformer: VisualTransformerConfig;
  isSelected: boolean;
  handleTransformerSelect: (transformerId: string) => void;
  index: number;
  isInPipeline: boolean;
  onAddTransformer?: (transformerId: string) => void;
  onRemoveTransformer?: (transformerId: string) => void;
  onParameterChange?: (
    transformerId: string,
    parameters: Record<string, unknown>,
  ) => void;
}

/**
 * A component that displays a transformer item in the pipeline.
 * @param param0 - The props for the transformer item.
 * @returns A React component that displays a transformer item in the pipeline.
 */
export function TransformerItem({
  transformer,
  isSelected,
  handleTransformerSelect,
  index,
  isInPipeline,
  onAddTransformer,
  onRemoveTransformer,
  onParameterChange,
}: TransformerItemProps) {
  const [isControlsExpanded, setIsControlsExpanded] = React.useState(false);
  // TODO: Implement parameter state for new structure
  const [parameters] = React.useState<Record<string, unknown>>({});

  // Notify parent of parameter changes
  const prevParametersRef = React.useRef<Record<string, unknown>>({});

  React.useEffect(() => {
    if (onParameterChange && Object.keys(parameters).length > 0) {
      // Check if parameters actually changed by comparing values
      const prevParams = prevParametersRef.current;
      const hasChanged = Object.keys(parameters).some(
        (key) => prevParams[key] !== parameters[key],
      );

      if (hasChanged) {
        prevParametersRef.current = { ...parameters };
        onParameterChange(transformer.id, parameters);
      }
    }
  }, [parameters, transformer.id, onParameterChange]);

  // TODO: Implement parameter change handling for new structure
  // const _handleParameterChange = (_key: string, _value: unknown) => {
  //   // Will be implemented when we redesign the parameter controls
  // };
  return (
    <div
      key={transformer.id}
      className={`p-3 rounded border cursor-pointer transition-colors ${
        isSelected
          ? 'bg-purple-100 border-purple-300'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
      onClick={() => {
        handleTransformerSelect(transformer.id);
      }}
    >
      <div className="flex items-center w-full">
        <div className="flex items-center space-x-2 flex-1 text-left">
          <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">
            {index + 1}
          </span>
          <span className="font-medium text-sm">
            {transformer.name || transformer.id}
          </span>
        </div>
        {isInPipeline ? (
          <button
            className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTransformer?.(transformer.id);
            }}
          >
            ×
          </button>
        ) : (
          <button
            className="text-gray-400 hover:text-green-500 text-sm flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddTransformer?.(transformer.id);
            }}
          >
            +
          </button>
        )}
      </div>
      {transformer.description && (
        <p className="text-xs text-gray-600 mt-1 text-left">
          {transformer.description}
        </p>
      )}

      {/* Parameter Controls - TODO: Redesign for dimensions and visual parameters */}
      {transformer.visualParameters.length > 0 && (
        <div className="mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsControlsExpanded(!isControlsExpanded);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>{isControlsExpanded ? '▼' : '▶'}</span>
            <span>Parameters ({transformer.visualParameters.length})</span>
          </button>

          {isControlsExpanded && (
            <div className="mt-3 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {transformer.name || transformer.id}
                  </span>
                  <span className="text-xs text-gray-500">
                    {transformer.visualParameters.length} params
                  </span>
                </div>
              </div>

              <div className="p-4">
                <p className="text-xs text-gray-500">
                  Parameter controls will be redesigned to show dimensions
                  first, then visual parameters.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
