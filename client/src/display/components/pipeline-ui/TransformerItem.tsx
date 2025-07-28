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
  const [parameters, setParameters] = React.useState<Record<string, unknown>>(
    () => {
      // Initialize parameters with default values
      const initialParams: Record<string, unknown> = {};
      if (transformer.parameters) {
        Object.entries(transformer.parameters).forEach(([key, config]) => {
          initialParams[key] = config.defaultValue;
        });
      }
      return initialParams;
    },
  );

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

  const handleParameterChange = (key: string, value: unknown) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
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

      {/* Parameter Controls */}
      {transformer.parameters &&
        Object.keys(transformer.parameters).length > 0 && (
          <div className="mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsControlsExpanded(!isControlsExpanded);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>{isControlsExpanded ? '▼' : '▶'}</span>
              <span>
                Parameters ({Object.keys(transformer.parameters).length})
              </span>
            </button>

            {isControlsExpanded && (
              <div className="mt-3 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                {/* Clean header */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {transformer.name || transformer.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Object.keys(transformer.parameters ?? {}).length} params
                    </span>
                  </div>
                </div>

                {/* Clean controls */}
                <div className="p-4 space-y-4">
                  {Object.entries(transformer.parameters ?? {}).map(
                    ([key, config]) => (
                      <div key={key} className="group">
                        {/* Parameter label */}
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                            {key}
                          </label>
                          {config.type === 'number' && (
                            <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                              {parameters[key] as number}
                            </span>
                          )}
                        </div>

                        {/* Number control */}
                        {config.type === 'number' && (
                          <div className="space-y-3">
                            {/* Clean slider */}
                            <div className="relative">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all duration-150"
                                  style={{
                                    width: `${String((((parameters[key] as number) - (config.min ?? 0)) / ((config.max ?? 100) - (config.min ?? 0))) * 100)}%`,
                                  }}
                                />
                              </div>
                              <input
                                type="range"
                                min={config.min}
                                max={config.max}
                                step={config.step}
                                value={parameters[key] as number}
                                onChange={(e) => {
                                  handleParameterChange(
                                    key,
                                    parseFloat(e.target.value),
                                  );
                                }}
                                className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{config.min}</span>
                                <span>{config.max}</span>
                              </div>
                            </div>

                            {/* Number input */}
                            <input
                              type="number"
                              min={config.min}
                              max={config.max}
                              step={config.step}
                              value={parameters[key] as number}
                              onChange={(e) => {
                                handleParameterChange(
                                  key,
                                  parseFloat(e.target.value),
                                );
                              }}
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            />
                          </div>
                        )}

                        {/* String control */}
                        {config.type === 'string' && (
                          <input
                            type="text"
                            value={parameters[key] as string}
                            onChange={(e) => {
                              handleParameterChange(key, e.target.value);
                            }}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          />
                        )}

                        {/* Boolean control */}
                        {config.type === 'boolean' && (
                          <div className="flex items-center">
                            <button
                              onClick={() => {
                                handleParameterChange(
                                  key,
                                  !(parameters[key] as boolean),
                                );
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                (parameters[key] as boolean)
                                  ? 'bg-blue-500 shadow-lg shadow-blue-500/25'
                                  : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-200 ${
                                  (parameters[key] as boolean)
                                    ? 'translate-x-6'
                                    : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="ml-3 text-sm text-gray-700">
                              {(parameters[key] as boolean)
                                ? 'Enabled'
                                : 'Disabled'}
                            </span>
                          </div>
                        )}

                        {/* Color control */}
                        {config.type === 'color' && (
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <input
                                type="color"
                                value={parameters[key] as string}
                                onChange={(e) => {
                                  handleParameterChange(key, e.target.value);
                                }}
                                className="h-10 w-10 rounded-lg border-2 border-gray-300 cursor-pointer bg-transparent"
                              />
                              <div
                                className="absolute inset-0 rounded-lg pointer-events-none"
                                style={{
                                  backgroundColor: parameters[key] as string,
                                }}
                              />
                            </div>
                            <input
                              type="text"
                              value={parameters[key] as string}
                              onChange={(e) => {
                                handleParameterChange(key, e.target.value);
                              }}
                              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-mono"
                            />
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                          {config.description}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
