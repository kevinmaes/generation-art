import React from 'react';
import type { VisualTransformerConfig } from '../../../transformers/types';
import { DIMENSIONS } from '../../../transformers/dimensions';
import { VISUAL_PARAMETERS } from '../../../transformers/visual-parameters';

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
  const [parameters, setParameters] = React.useState<{
    dimensions: { primary?: string; secondary?: string };
    visual: Record<string, unknown>;
  }>({
    dimensions: {
      primary: transformer.defaultPrimaryDimension,
      secondary: transformer.defaultSecondaryDimension,
    },
    visual: {},
  });

  // Notify parent of parameter changes
  const prevParametersRef = React.useRef(parameters);

  React.useEffect(() => {
    if (onParameterChange) {
      const prevParams = prevParametersRef.current;
      const hasChanged =
        prevParams.dimensions.primary !== parameters.dimensions.primary ||
        prevParams.dimensions.secondary !== parameters.dimensions.secondary ||
        JSON.stringify(prevParams.visual) !== JSON.stringify(parameters.visual);

      if (hasChanged) {
        prevParametersRef.current = { ...parameters };
        onParameterChange(transformer.id, parameters);
      }
    }
  }, [parameters, transformer.id, onParameterChange]);

  const handleDimensionChange = (
    type: 'primary' | 'secondary',
    value: string | undefined,
  ) => {
    setParameters((prev) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [type]: value,
      },
    }));
  };

  const handleVisualParameterChange = (key: string, value: unknown) => {
    setParameters((prev) => ({
      ...prev,
      visual: {
        ...prev.visual,
        [key]: value,
      },
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
      {(transformer.availableDimensions.length > 0 ||
        transformer.visualParameters.length > 0) && (
        <details
          className="mt-2"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <summary className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex items-center space-x-1 list-none">
            <span className="text-xs">▶</span>
            <span>
              Parameters (
              {transformer.availableDimensions.length +
                transformer.visualParameters.length}
              )
            </span>
          </summary>

          <div className="mt-3 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {transformer.name || transformer.id}
                </span>
                <span className="text-xs text-gray-500">
                  {transformer.availableDimensions.length} dimensions,{' '}
                  {transformer.visualParameters.length} visual params
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Dimensions Section */}
              {transformer.availableDimensions.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">
                    Dimensions
                  </h4>

                  {/* Primary Dimension */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">
                      Primary
                    </label>
                    <select
                      value={
                        parameters.dimensions.primary ??
                        transformer.defaultPrimaryDimension
                      }
                      onChange={(e) => {
                        handleDimensionChange('primary', e.target.value);
                      }}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      {transformer.availableDimensions.map((dimId) => (
                        <option key={dimId} value={dimId}>
                          {DIMENSIONS[dimId].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Secondary Dimensions */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Secondary
                    </label>
                    <select
                      value={parameters.dimensions.secondary ?? ''}
                      onChange={(e) => {
                        handleDimensionChange(
                          'secondary',
                          e.target.value || undefined,
                        );
                      }}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="">No secondary dimension</option>
                      {transformer.availableDimensions
                        .filter(
                          (dimId) => dimId !== parameters.dimensions.primary,
                        )
                        .map((dimId) => (
                          <option key={dimId} value={dimId}>
                            {DIMENSIONS[dimId].label}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Visual Parameters Section */}
              {transformer.visualParameters.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">
                    Visual Parameters
                  </h4>
                  <div className="space-y-2">
                    {transformer.visualParameters.map((paramId) => {
                      const param = VISUAL_PARAMETERS[paramId];

                      return (
                        <div key={paramId}>
                          <label className="block text-xs text-gray-600 mb-1">
                            {param.label}
                          </label>
                          {param.type === 'select' && param.options ? (
                            <select
                              value={
                                (parameters.visual[paramId] as string) ||
                                (param.defaultValue as string)
                              }
                              onChange={(e) => {
                                handleVisualParameterChange(
                                  paramId,
                                  e.target.value,
                                );
                              }}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            >
                              {param.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : param.type === 'range' ? (
                            <input
                              type="range"
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              value={
                                (parameters.visual[paramId] as number) ||
                                (param.defaultValue as number)
                              }
                              onChange={(e) => {
                                handleVisualParameterChange(
                                  paramId,
                                  Number(e.target.value),
                                );
                              }}
                              className="w-full"
                            />
                          ) : param.type === 'number' ? (
                            <input
                              type="number"
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              value={
                                (parameters.visual[paramId] as number) ||
                                (param.defaultValue as number)
                              }
                              onChange={(e) => {
                                handleVisualParameterChange(
                                  paramId,
                                  Number(e.target.value),
                                );
                              }}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            />
                          ) : param.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={
                                (parameters.visual[paramId] as boolean) ||
                                (param.defaultValue as boolean)
                              }
                              onChange={(e) => {
                                handleVisualParameterChange(
                                  paramId,
                                  e.target.checked,
                                );
                              }}
                              className="text-xs"
                            />
                          ) : (
                            <input
                              type="text"
                              value={
                                (parameters.visual[paramId] as string) ||
                                (param.defaultValue as string)
                              }
                              onChange={(e) => {
                                handleVisualParameterChange(
                                  paramId,
                                  e.target.value,
                                );
                              }}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
