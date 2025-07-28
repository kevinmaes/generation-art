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
    parameters: {
      dimensions: { primary?: string; secondary?: string };
      visual: Record<string, unknown>;
    },
  ) => void;
  onParameterReset?: (transformerId: string) => void;
  currentParameters?: {
    dimensions: { primary?: string; secondary?: string };
    visual: Record<string, unknown>;
  };
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
  onParameterReset,
  currentParameters,
}: TransformerItemProps) {
  const [parameters, setParameters] = React.useState<{
    dimensions: { primary?: string; secondary?: string };
    visual: Record<string, unknown>;
  }>(() => {
    // Use current parameters if available, otherwise use defaults
    if (currentParameters) {
      return currentParameters;
    }
    return {
      dimensions: {
        primary: transformer.defaultPrimaryDimension,
        secondary: transformer.defaultSecondaryDimension,
      },
      visual: {},
    };
  });

  // Update local state when currentParameters change
  React.useEffect(() => {
    if (currentParameters) {
      setParameters(currentParameters);
    }
  }, [currentParameters]);

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
          {isInPipeline && (
            <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">
              {index + 1}
            </span>
          )}
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
      {isInPipeline &&
        (transformer.availableDimensions.length > 0 ||
          transformer.visualParameters.length > 0) && (
          <details
            className="mt-2 group"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <summary className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex items-center space-x-1 list-none">
              <span className="text-xs transition-transform duration-200 group-open:rotate-90">
                ▶
              </span>
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
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {transformer.availableDimensions.length} dimensions,{' '}
                      {transformer.visualParameters.length} visual params
                    </span>
                    {onParameterReset && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onParameterReset(transformer.id);
                        }}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                        title="Reset to defaults"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Dimensions Section */}
                {transformer.availableDimensions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Dimensions + Temperature
                    </h4>

                    {/* Dimensions Row */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Primary Dimension */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1 text-left">
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
                        <label className="block text-xs text-gray-600 mb-1 text-left">
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
                              (dimId) =>
                                dimId !== parameters.dimensions.primary,
                            )
                            .map((dimId) => (
                              <option key={dimId} value={dimId}>
                                {DIMENSIONS[dimId].label}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Temperature */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1 text-left">
                          Temperature
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.1}
                          value={
                            (parameters.visual.temperature as number) ||
                            (VISUAL_PARAMETERS.temperature
                              .defaultValue as number)
                          }
                          onChange={(e) => {
                            handleVisualParameterChange(
                              'temperature',
                              Number(e.target.value),
                            );
                          }}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visual Parameters Section */}
                {transformer.visualParameters.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Visual Parameters
                    </h4>

                    {/* Two-column layout: Sliders+Colors on left, Dropdowns+Numbers on right */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left column: Sliders and Color pickers */}
                      <div>
                        {(() => {
                          const leftColumnParams =
                            transformer.visualParameters.filter((paramId) => {
                              const param = VISUAL_PARAMETERS[paramId];
                              return (
                                (param.type === 'range' ||
                                  param.type === 'color') &&
                                paramId !== 'temperature'
                              );
                            });
                          if (leftColumnParams.length > 0) {
                            return (
                              <div className="space-y-3">
                                {leftColumnParams.map((paramId) => {
                                  const param = VISUAL_PARAMETERS[paramId];
                                  return (
                                    <div key={paramId}>
                                      <label className="block text-xs text-gray-600 mb-1 text-left">
                                        {param.label}
                                      </label>
                                      {param.type === 'range' ? (
                                        <>
                                          <input
                                            type="range"
                                            min={param.min}
                                            max={param.max}
                                            step={param.step}
                                            value={
                                              (parameters.visual[
                                                paramId
                                              ] as number) ||
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
                                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>{param.min}</span>
                                            <span>{param.max}</span>
                                          </div>
                                        </>
                                      ) : param.type === 'color' ? (
                                        <input
                                          type="color"
                                          value={
                                            (parameters.visual[
                                              paramId
                                            ] as string) ||
                                            (param.defaultValue as string)
                                          }
                                          onChange={(e) => {
                                            handleVisualParameterChange(
                                              paramId,
                                              e.target.value,
                                            );
                                          }}
                                          className="w-full h-8 border border-gray-300 rounded"
                                        />
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Right column: Dropdowns and Numerical inputs */}
                      <div>
                        {(() => {
                          const rightColumnParams =
                            transformer.visualParameters.filter((paramId) => {
                              const param = VISUAL_PARAMETERS[paramId];
                              return (
                                param.type === 'select' ||
                                param.type === 'number' ||
                                param.type === 'boolean'
                              );
                            });
                          if (rightColumnParams.length > 0) {
                            return (
                              <div className="space-y-3">
                                {rightColumnParams.map((paramId) => {
                                  const param = VISUAL_PARAMETERS[paramId];
                                  return (
                                    <div key={paramId}>
                                      <label className="block text-xs text-gray-600 mb-1 text-left">
                                        {param.label}
                                      </label>
                                      {param.type === 'select' &&
                                      param.options ? (
                                        <select
                                          value={
                                            (parameters.visual[
                                              paramId
                                            ] as string) ||
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
                                            <option
                                              key={option.value}
                                              value={option.value}
                                            >
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      ) : param.type === 'number' ? (
                                        <input
                                          type="number"
                                          min={param.min}
                                          max={param.max}
                                          step={param.step}
                                          value={
                                            (parameters.visual[
                                              paramId
                                            ] as number) ||
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
                                            (parameters.visual[
                                              paramId
                                            ] as boolean) ||
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
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
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
