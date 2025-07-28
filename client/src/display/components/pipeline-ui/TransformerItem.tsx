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
  // NEW: Disable controls during visualization
  isVisualizing?: boolean;
}

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
  isVisualizing = false,
}: TransformerItemProps) {
  // Local parameter state
  const [parameters, setParameters] = React.useState<{
    dimensions: { primary?: string; secondary?: string };
    visual: Record<string, unknown>;
  }>(() => {
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

  // Separate state for slider values during dragging
  const [sliderValues, setSliderValues] = React.useState<
    Record<string, unknown>
  >({});

  // Update local state when currentParameters change (from parent)
  React.useEffect(() => {
    if (currentParameters) {
      setParameters(currentParameters);
    }
  }, [currentParameters]);

  // Handle dimension changes
  const handleDimensionChange = (
    type: 'primary' | 'secondary',
    value: string | undefined,
  ) => {
    const newParameters = {
      ...parameters,
      dimensions: {
        ...parameters.dimensions,
        [type]: value,
      },
    };
    setParameters(newParameters);
    onParameterChange?.(transformer.id, newParameters);
  };

  // Handle visual parameter changes (non-sliders)
  const handleVisualParameterChange = (key: string, value: unknown) => {
    const newParameters = {
      ...parameters,
      visual: {
        ...parameters.visual,
        [key]: value,
      },
    };
    setParameters(newParameters);
    onParameterChange?.(transformer.id, newParameters);
  };

  // Handle slider input during dragging
  const handleSliderInput = (key: string, value: unknown) => {
    setSliderValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle slider change completion
  const handleSliderChangeComplete = (key: string, value: unknown) => {
    const newParameters = {
      ...parameters,
      visual: {
        ...parameters.visual,
        [key]: value,
      },
    };
    setParameters(newParameters);
    setSliderValues((prev) => {
      const { [key]: _, ...newValues } = prev; // Clear the slider value
      return newValues;
    });
    onParameterChange?.(transformer.id, newParameters);
  };

  // Handle parameter reset
  const handleParameterReset = () => {
    const defaultParameters = {
      dimensions: {
        primary: transformer.defaultPrimaryDimension,
        secondary: transformer.defaultSecondaryDimension,
      },
      visual: {},
    };
    setParameters(defaultParameters);
    setSliderValues({});
    onParameterChange?.(transformer.id, defaultParameters);
    onParameterReset?.(transformer.id);
  };

  // Disable controls during visualization
  const isDisabled = isVisualizing;

  return (
    <div
      key={transformer.id}
      className={`p-3 rounded border cursor-pointer transition-colors ${
        isSelected
          ? 'bg-purple-100 border-purple-300'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      } ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={() => {
        if (!isDisabled) {
          handleTransformerSelect(transformer.id);
        }
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
              if (!isDisabled) {
                onRemoveTransformer?.(transformer.id);
              }
            }}
            disabled={isDisabled}
          >
            ×
          </button>
        ) : (
          <button
            className="text-gray-400 hover:text-green-500 text-sm flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (!isDisabled) {
                onAddTransformer?.(transformer.id);
              }
            }}
            disabled={isDisabled}
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
            <summary className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-t-lg shadow-sm cursor-pointer flex items-center justify-between list-none hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-2">
                <span className="text-xs transition-transform duration-200 group-open:rotate-90">
                  ▶
                </span>
                <span className="text-xs font-medium text-gray-700">
                  Parameters (
                  {transformer.availableDimensions.length +
                    transformer.visualParameters.length}
                  )
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {transformer.availableDimensions.length} dimensions,{' '}
                  {transformer.visualParameters.length} visual params
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleParameterReset();
                  }}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                  title="Reset to defaults"
                  disabled={isDisabled}
                >
                  Reset
                </button>
              </div>
            </summary>

            <div className="bg-white border-l border-r border-b border-gray-200 rounded-b-lg shadow-sm overflow-hidden">
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
                          disabled={isDisabled}
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
                          disabled={isDisabled}
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
                            sliderValues.temperature !== undefined
                              ? (sliderValues.temperature as number)
                              : (parameters.visual.temperature as number) ||
                                (VISUAL_PARAMETERS.temperature
                                  .defaultValue as number)
                          }
                          onInput={(e) => {
                            handleSliderInput(
                              'temperature',
                              Number((e.target as HTMLInputElement).value),
                            );
                          }}
                          onChange={(e) => {
                            handleSliderChangeComplete(
                              'temperature',
                              Number(e.target.value),
                            );
                          }}
                          className="w-full"
                          disabled={isDisabled}
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
                                              sliderValues[paramId] !==
                                              undefined
                                                ? (sliderValues[
                                                    paramId
                                                  ] as number)
                                                : (parameters.visual[
                                                    paramId
                                                  ] as number) ||
                                                  (param.defaultValue as number)
                                            }
                                            onInput={(e) => {
                                              handleSliderInput(
                                                paramId,
                                                Number(
                                                  (e.target as HTMLInputElement)
                                                    .value,
                                                ),
                                              );
                                            }}
                                            onChange={(e) => {
                                              handleSliderChangeComplete(
                                                paramId,
                                                Number(e.target.value),
                                              );
                                            }}
                                            className="w-full"
                                            disabled={isDisabled}
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
                                          disabled={isDisabled}
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
                                          disabled={isDisabled}
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
                                          disabled={isDisabled}
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
                                          disabled={isDisabled}
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
