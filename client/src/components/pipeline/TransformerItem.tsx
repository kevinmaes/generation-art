import React from 'react';
import type { VisualTransformerConfig } from '../../transformers/types';
import type { TransformerId } from '../../transformers/transformers';
import { DIMENSIONS } from '../../transformers/dimensions';
import {
  VISUAL_PARAMETERS,
  type VisualParameterValues,
} from '../../transformers/visual-parameters';
import { getProviderInfo } from '../../services/llm-service';

interface TransformerItemProps {
  transformer: VisualTransformerConfig;
  isSelected: boolean;
  handleTransformerSelect: (transformerId: TransformerId) => void;
  index: number;
  isInPipeline: boolean;
  onAddTransformer?: (transformerId: TransformerId) => void;
  onRemoveTransformer?: (transformerId: TransformerId) => void;
  onParameterChange?: (
    transformerId: TransformerId,
    parameters: {
      dimensions: { primary?: string; secondary?: string };
      visual: VisualParameterValues;
    },
  ) => void;
  onParameterReset?: (transformerId: TransformerId) => void;
  currentParameters?: {
    dimensions: { primary?: string; secondary?: string };
    visual: VisualParameterValues;
  };
  // NEW: Disable controls during visualization
  isVisualizing?: boolean;
  // NEW: Last run parameters to compare for "Modified" badge
  lastRunParameters?: {
    dimensions: { primary?: string; secondary?: string };
    visual: VisualParameterValues;
  };
  // NEW: Expanded state management for available transformers
  isExpanded?: boolean;
  onToggleExpanded?: (transformerId: string) => void;
  // NEW: Custom action buttons for different contexts
  customActions?: {
    removeButton?: React.ReactNode;
  };
}

export function TransformerItem({
  transformer,
  isSelected: _isSelected,
  handleTransformerSelect,
  index,
  isInPipeline,
  onAddTransformer,
  onRemoveTransformer,
  onParameterChange,
  onParameterReset,
  currentParameters,
  isVisualizing = false,
  lastRunParameters,
  isExpanded = false,
  onToggleExpanded,
  customActions,
}: TransformerItemProps) {
  // Local parameter state
  const [parameters, setParameters] = React.useState<{
    dimensions: { primary?: string; secondary?: string };
    visual: VisualParameterValues;
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
    Record<string, string | number | boolean | undefined>
  >({});

  // Update local state when currentParameters change (from parent)
  React.useEffect(() => {
    if (currentParameters) {
      setParameters(currentParameters);
    }
  }, [currentParameters]);

  // Check if parameters have been modified since last run
  const hasBeenModified = React.useMemo(() => {
    if (!lastRunParameters || !currentParameters) return false;

    // Check dimensions
    if (
      currentParameters.dimensions.primary !==
        lastRunParameters.dimensions.primary ||
      currentParameters.dimensions.secondary !==
        lastRunParameters.dimensions.secondary
    ) {
      return true;
    }

    // Check visual parameters
    const currentVisualKeys = Object.keys(currentParameters.visual);
    const lastVisualKeys = Object.keys(lastRunParameters.visual);

    if (currentVisualKeys.length !== lastVisualKeys.length) return true;

    return currentVisualKeys.some(
      (key) => currentParameters.visual[key] !== lastRunParameters.visual[key],
    );
  }, [currentParameters, lastRunParameters]);

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
  const handleVisualParameterChange = (
    key: string,
    value: string | number | boolean,
  ) => {
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
  const handleSliderInput = (
    key: string,
    value: string | number | boolean | undefined,
  ) => {
    setSliderValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle slider change completion
  const handleSliderChangeComplete = (
    key: string,
    value: string | number | boolean,
  ) => {
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
      className={`${
        isInPipeline
          ? ''
          : 'px-2 py-1 rounded border transition-colors bg-gray-50 border-gray-200 hover:bg-gray-100'
      } ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Clickable Header */}
      <div
        className="flex items-center w-full cursor-pointer"
        onClick={() => {
          if (!isDisabled) {
            if (isInPipeline) {
              handleTransformerSelect(transformer.id);
            } else {
              onToggleExpanded?.(transformer.id);
            }
          }
        }}
      >
        <div className="flex items-center space-x-1.5 flex-1 text-left">
          {!isInPipeline && (
            <span
              className={`text-xs transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            >
              ▶
            </span>
          )}
          {isInPipeline && (
            <span className="text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded">
              {index + 1}
            </span>
          )}
          <span className="font-medium text-sm truncate">
            {transformer.name || transformer.id}
            {transformer.requiresLLM && (
              <span className="ml-2 font-mono text-xs text-gray-500 font-normal">
                {getProviderInfo().model}
              </span>
            )}
          </span>
          {hasBeenModified && (
            <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
              Modified
            </span>
          )}
        </div>
        {isInPipeline ? (
          (customActions?.removeButton ?? (
            <button
              className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
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
          ))
        ) : (
          <button
            className="text-gray-400 hover:text-green-500 text-xs flex-shrink-0"
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

      {/* Short Description - always visible */}
      {transformer.shortDescription && (
        <p className="text-xs text-gray-800 font-medium mt-0.5 text-left">
          {transformer.shortDescription}
        </p>
      )}

      {/* Expandable Full Description - only for available transformers */}
      {!isInPipeline && isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
          {transformer.description && (
            <p className="text-xs text-gray-700 text-left">
              {transformer.description}
            </p>
          )}

          {/* Dimensions line */}
          <p className="text-xs text-left">
            <span className="text-gray-800 font-medium">Dimensions:</span>{' '}
            <span className="text-gray-600">
              {transformer.availableDimensions
                .map((dimId) => DIMENSIONS[dimId].label)
                .join(', ')}
            </span>
          </p>

          {/* Parameters line */}
          <p className="text-xs text-left">
            <span className="text-gray-800 font-medium">Parameters:</span>{' '}
            <span className="text-gray-600">
              {transformer.visualParameters
                .map((param) => param.label ?? param.name)
                .join(', ')}
            </span>
          </p>
        </div>
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
            <summary className="px-4 py-2 bg-gray-50 border border-gray-200 shadow-sm cursor-pointer flex items-center justify-between list-none hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-2">
                <span className="text-xs transition-transform duration-200 group-open:rotate-90">
                  ▶
                </span>
                <span className="text-xs font-medium text-gray-700">
                  Parameters
                </span>
              </div>
              <div className="flex items-center space-x-2">
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

            <div className="bg-white border-l border-r border-b border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Dimensions Section */}
                {transformer.availableDimensions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2 text-left">
                      {transformer.requiresLLM
                        ? 'Dimensions + Temperature'
                        : 'Dimensions'}
                    </h4>

                    {/* Dimensions Row */}
                    <div
                      className={`grid gap-2 ${transformer.requiresLLM ? 'grid-cols-3' : 'grid-cols-2'}`}
                    >
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

                      {/* Temperature - only show for LLM transformers */}
                      {transformer.requiresLLM && (
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
                      )}
                    </div>
                  </div>
                )}

                {/* Visual Parameters Section */}
                {transformer.visualParameters.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2 text-left">
                      Visual Parameters
                    </h4>

                    {/* Two-column layout: Sliders+Colors on left, Dropdowns+Numbers on right */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left column: Sliders first, then Color pickers */}
                      <div>
                        {(() => {
                          // Separate sliders and color pickers, prioritizing sliders first
                          const sliderParams =
                            transformer.visualParameters.filter((param) => {
                              return (
                                param.type === 'range' &&
                                param.name !== 'temperature'
                              );
                            });

                          const colorParams =
                            transformer.visualParameters.filter((param) => {
                              return param.type === 'color';
                            });

                          const booleanParams =
                            transformer.visualParameters.filter((param) => {
                              return param.type === 'boolean';
                            });

                          const leftColumnParams = [
                            ...sliderParams,
                            ...colorParams,
                            ...booleanParams,
                          ];

                          if (leftColumnParams.length > 0) {
                            return (
                              <div className="space-y-3">
                                {leftColumnParams.map((param) => {
                                  return (
                                    <div key={param.name}>
                                      {param.type !== 'boolean' && (
                                        <label className="block text-xs text-gray-600 mb-1 text-left">
                                          {param.label}
                                        </label>
                                      )}
                                      {param.type === 'range' ? (
                                        <>
                                          <input
                                            type="range"
                                            min={param.min}
                                            max={param.max}
                                            step={param.step}
                                            value={
                                              sliderValues[param.name] !==
                                              undefined
                                                ? (sliderValues[
                                                    param.name
                                                  ] as number)
                                                : (parameters.visual[
                                                    param.name
                                                  ] as number) ||
                                                  (param.defaultValue as number)
                                            }
                                            onInput={(e) => {
                                              handleSliderInput(
                                                param.name,
                                                Number(
                                                  (e.target as HTMLInputElement)
                                                    .value,
                                                ),
                                              );
                                            }}
                                            onChange={(e) => {
                                              handleSliderChangeComplete(
                                                param.name,
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
                                              param.name
                                            ] as string) ||
                                            (param.defaultValue as string)
                                          }
                                          onChange={(e) => {
                                            handleVisualParameterChange(
                                              param.name,
                                              e.target.value,
                                            );
                                          }}
                                          className="w-full h-8 border border-gray-300 rounded"
                                          disabled={isDisabled}
                                        />
                                      ) : param.type === 'boolean' ? (
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={
                                              typeof parameters.visual[
                                                param.name
                                              ] === 'boolean'
                                                ? (parameters.visual[
                                                    param.name
                                                  ] as boolean)
                                                : (param.defaultValue as boolean)
                                            }
                                            onChange={(e) => {
                                              handleVisualParameterChange(
                                                param.name,
                                                e.target.checked,
                                              );
                                            }}
                                            className="text-xs"
                                            disabled={isDisabled}
                                          />
                                          <span className="text-xs text-gray-600">
                                            {param.label}
                                          </span>
                                        </div>
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
                            transformer.visualParameters.filter((param) => {
                              return (
                                param.type === 'select' ||
                                param.type === 'number'
                              );
                            });
                          if (rightColumnParams.length > 0) {
                            return (
                              <div className="space-y-3">
                                {rightColumnParams.map((param) => {
                                  return (
                                    <div key={param.name}>
                                      <label className="block text-xs text-gray-600 mb-1 text-left">
                                        {param.label}
                                      </label>
                                      {param.type === 'select' &&
                                      param.options ? (
                                        <select
                                          value={
                                            (parameters.visual[
                                              param.name
                                            ] as string) ||
                                            (param.defaultValue as string)
                                          }
                                          onChange={(e) => {
                                            handleVisualParameterChange(
                                              param.name,
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
                                              param.name
                                            ] as number) ||
                                            (param.defaultValue as number)
                                          }
                                          onChange={(e) => {
                                            handleVisualParameterChange(
                                              param.name,
                                              Number(e.target.value),
                                            );
                                          }}
                                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
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
