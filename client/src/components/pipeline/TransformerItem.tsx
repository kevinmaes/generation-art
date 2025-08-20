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
  displayIndex?: string; // Optional display index (e.g., "1", "1a")
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
  // NEW: Flag to indicate this is a variance transformer
  isVarianceTransformer?: boolean;
  // NEW: Props for variance toggle
  hasVarianceToggle?: boolean;
  isVarianceFollowing?: boolean;
  onToggleVariance?: () => void;
  parameterKey?: string; // Add parameter key for unique parameter storage
}

export function TransformerItem({
  transformer,
  isSelected: _isSelected,
  handleTransformerSelect,
  index,
  isInPipeline,
  displayIndex,
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
  isVarianceTransformer = false,
  hasVarianceToggle = false,
  isVarianceFollowing = false,
  onToggleVariance,
  parameterKey,
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
    // Use parameterKey if provided (for variance transformers), otherwise use transformer.id
    const storageKey = parameterKey ?? transformer.id;
    onParameterChange?.(storageKey as TransformerId, newParameters);
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
    // Use parameterKey if provided (for variance transformers), otherwise use transformer.id
    const storageKey = parameterKey ?? transformer.id;
    onParameterChange?.(storageKey as TransformerId, newParameters);
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
    // Use parameterKey if provided (for variance transformers), otherwise use transformer.id
    const storageKey = parameterKey ?? transformer.id;
    onParameterChange?.(storageKey as TransformerId, newParameters);
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
    // Use parameterKey if provided (for variance transformers), otherwise use transformer.id
    const storageKey = parameterKey ?? transformer.id;
    onParameterReset?.(storageKey as TransformerId);
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
              {displayIndex ?? index + 1}
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
          customActions && 'removeButton' in customActions ? (
            customActions.removeButton
          ) : (
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
          )
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
                {/* Dimensions Section - Hide for variance transformers */}
                {transformer.availableDimensions.length > 0 &&
                  !isVarianceTransformer && (
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
                            <div className="flex items-center gap-3">
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
                                className="flex-1"
                                disabled={isDisabled}
                              />
                              {/* Current value display */}
                              <div className="min-w-[50px] text-right text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                {(() => {
                                  const value =
                                    sliderValues.temperature !== undefined
                                      ? (sliderValues.temperature as number)
                                      : (parameters.visual.temperature as number) ||
                                        (VISUAL_PARAMETERS.temperature
                                          .defaultValue as number);
                                  return `${(value * 100).toFixed(0)}%`;
                                })()}
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>0%</span>
                              <span>100%</span>
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
                    {/* Single column for variance transformer */}
                    <div
                      className={
                        isVarianceTransformer ? '' : 'grid grid-cols-2 gap-4'
                      }
                    >
                      {/* Left column: Sliders first, then Color pickers */}
                      <div>
                        {(() => {
                          // Filter parameters based on whether this is a variance transformer
                          const filteredParams = isVarianceTransformer
                            ? transformer.visualParameters.filter(
                                (p) => p.name !== 'limitToPreviousChanges',
                              )
                            : transformer.visualParameters;

                          // Separate sliders and color pickers, prioritizing sliders first
                          const sliderParams = filteredParams.filter(
                            (param) => {
                              return (
                                param.type === 'range' &&
                                param.name !== 'temperature'
                              );
                            },
                          );

                          const colorParams = filteredParams.filter((param) => {
                            return param.type === 'color';
                          });

                          const booleanParams = filteredParams.filter(
                            (param) => {
                              return param.type === 'boolean';
                            },
                          );

                          // Add varianceAmount and varianceMode to left column if they exist
                          const varianceAmountParam = filteredParams.find(
                            (p) => p.name === 'varianceAmount',
                          );
                          const varianceModeParam = filteredParams.find(
                            (p) => p.name === 'varianceMode',
                          );

                          const leftColumnParams = [
                            ...(varianceAmountParam
                              ? [varianceAmountParam]
                              : []),
                            ...(varianceModeParam ? [varianceModeParam] : []),
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
                                      {param.name === 'varianceAmount' &&
                                      param.type === 'select' &&
                                      param.options ? (
                                        // Segmented button group for variance amount in left column
                                        <div
                                          className="inline-flex shadow-sm w-full"
                                          role="group"
                                        >
                                          {param.options.map(
                                            (option, index) => {
                                              const isSelected =
                                                (parameters.visual[
                                                  param.name
                                                ] ?? param.defaultValue) ===
                                                option.value;
                                              const isFirst = index === 0;
                                              return (
                                                <button
                                                  key={option.value}
                                                  type="button"
                                                  onClick={() => {
                                                    handleVisualParameterChange(
                                                      param.name,
                                                      option.value,
                                                    );
                                                  }}
                                                  disabled={isDisabled}
                                                  className={`
                                                  flex-1 px-1 py-1 text-xs font-medium transition-colors
                                                  ${!isFirst ? 'border-l-0' : ''}
                                                  ${
                                                    isSelected
                                                      ? 'bg-blue-600 text-white border-blue-600 z-10'
                                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                  }
                                                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                `}
                                                >
                                                  <div className="flex flex-col items-center">
                                                    <span className="text-[11px] leading-tight">
                                                      {
                                                        option.label.split(
                                                          ' ',
                                                        )[0]
                                                      }
                                                    </span>
                                                    <span className="text-[9px] opacity-75">
                                                      {/\d+%/.exec(
                                                        option.label,
                                                      )?.[0] ?? ''}
                                                    </span>
                                                  </div>
                                                </button>
                                              );
                                            },
                                          )}
                                        </div>
                                      ) : param.name === 'varianceMode' &&
                                        param.type === 'select' &&
                                        param.options ? (
                                        // Variance mode dropdown - full width below variance amount
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
                                      ) : param.type === 'range' ? (
                                        <div>
                                          <div className="flex items-center gap-3">
                                            <div className="flex-1">
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
                                                <span>
                                                  {(() => {
                                                    // Show min value with unit
                                                    if (param.unit === '%' && param.min !== undefined) {
                                                      return `${(param.min * 100).toFixed(0)}%`;
                                                    } else if (param.unit === 'px') {
                                                      return `${String(param.min ?? '')}px`;
                                                    } else if (param.unit) {
                                                      return `${String(param.min ?? '')}${param.unit}`;
                                                    } else {
                                                      return String(param.min ?? '');
                                                    }
                                                  })()}
                                                </span>
                                                <span>
                                                  {(() => {
                                                    // Show max value with unit
                                                    if (param.unit === '%' && param.max !== undefined) {
                                                      return `${(param.max * 100).toFixed(0)}%`;
                                                    } else if (param.unit === 'px') {
                                                      return `${String(param.max ?? '')}px`;
                                                    } else if (param.unit) {
                                                      return `${String(param.max ?? '')}${param.unit}`;
                                                    } else {
                                                      return String(param.max ?? '');
                                                    }
                                                  })()}
                                                </span>
                                              </div>
                                            </div>
                                            {/* Current value display */}
                                            <div className="min-w-[65px] text-right text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                              {(() => {
                                                const value =
                                                  sliderValues[param.name] !==
                                                  undefined
                                                    ? (sliderValues[
                                                        param.name
                                                      ] as number)
                                                    : (parameters.visual[
                                                        param.name
                                                      ] as number) ||
                                                      (param.defaultValue as number);
                                                // Use custom formatter if provided
                                                if (param.formatValue) {
                                                  return param.formatValue(value);
                                                }
                                                // Format based on unit
                                                if (param.unit === '%') {
                                                  return `${(value * 100).toFixed(0)}%`;
                                                } else if (param.unit === 'px') {
                                                  return `${String(Math.round(value))}px`;
                                                } else if (param.unit) {
                                                  return `${String(value)}${param.unit}`;
                                                } else if (param.step && param.step < 1) {
                                                  return value.toFixed(1);
                                                } else {
                                                  return Math.round(value).toString();
                                                }
                                              })()}
                                            </div>
                                          </div>
                                        </div>
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
                          // Use the same filtered params for consistency
                          const filteredParams = isVarianceTransformer
                            ? transformer.visualParameters.filter(
                                (p) => p.name !== 'limitToPreviousChanges',
                              )
                            : transformer.visualParameters;

                          const rightColumnParams = filteredParams.filter(
                            (param) => {
                              // Move varianceAmount and varianceMode to left column for better visual grouping
                              if (
                                param.name === 'varianceAmount' ||
                                param.name === 'varianceMode'
                              )
                                return false;
                              return (
                                param.type === 'select' ||
                                param.type === 'number'
                              );
                            },
                          );
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

      {/* Variance toggle switch - shown for non-variance transformers, outside collapsible */}
      {isInPipeline && hasVarianceToggle && (
        <div
          className={`px-4 py-2 bg-gray-50 border border-gray-200 ${
            transformer.availableDimensions.length > 0 ||
            transformer.visualParameters.length > 0
              ? 'border-t-0 rounded-b mt-0'
              : 'rounded mt-2'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">
              Add variance after
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isVarianceFollowing}
              onClick={(e) => {
                e.stopPropagation();
                onToggleVariance?.();
              }}
              disabled={isVisualizing}
              style={{
                position: 'relative',
                display: 'inline-flex',
                height: '20px',
                width: '36px',
                alignItems: 'center',
                borderRadius: '9999px',
                backgroundColor: isVarianceFollowing ? '#2563eb' : '#d1d5db',
                transition: 'background-color 200ms',
                cursor: isVisualizing ? 'not-allowed' : 'pointer',
                opacity: isVisualizing ? 0.5 : 1,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: isVarianceFollowing ? '20px' : '4px',
                  height: '12px',
                  width: '12px',
                  borderRadius: '9999px',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  transition: 'left 200ms',
                }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
