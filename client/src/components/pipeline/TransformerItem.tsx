import React from 'react';
import type { VisualTransformerConfig } from '../../pipeline/types';
import type { TransformerId } from '../../pipeline/transformers';
import type { VisualParameterValues } from '../../pipeline/visual-parameters';

// Sub-components
import { TransformerHeader } from './transformer-header/TransformerHeader';
import { TransformerDescription } from './transformer-details/TransformerDescription';
import { TransformerMetadata } from './transformer-details/TransformerMetadata';
import { VarianceToggle } from './transformer-details/VarianceToggle';
import { DimensionsControl } from './transformer-controls/DimensionsControl';
import { VisualParametersGrid } from './transformer-controls/VisualParametersGrid';

interface TransformerItemProps {
  transformer: VisualTransformerConfig;
  isSelected: boolean;
  handleTransformerSelect: (transformerId: TransformerId) => void;
  index: number;
  isInPipeline: boolean;
  displayIndex?: string;
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
  isVisualizing?: boolean;
  lastRunParameters?: {
    dimensions: { primary?: string; secondary?: string };
    visual: VisualParameterValues;
  };
  isExpanded?: boolean;
  onToggleExpanded?: (transformerId: string) => void;
  customActions?: {
    removeButton?: React.ReactNode;
  };
  isVarianceTransformer?: boolean;
  hasVarianceToggle?: boolean;
  isVarianceFollowing?: boolean;
  onToggleVariance?: () => void;
  parameterKey?: string;
  isActive?: boolean;
  onToggleActive?: () => void;
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
  isActive = true,
  onToggleActive,
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

  // Sync local state when currentParameters changes
  React.useEffect(() => {
    if (currentParameters) {
      setParameters(currentParameters);
    }
  }, [currentParameters]);

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
      const { [key]: _, ...newValues } = prev;
      return newValues;
    });
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
    const storageKey = parameterKey ?? transformer.id;
    onParameterReset?.(storageKey as TransformerId);
  };

  // Disable controls during visualization or when inactive
  const isDisabled = isVisualizing || !isActive;

  // Auto-collapse when inactive
  const effectiveExpanded = isActive ? isExpanded : false;

  const hasParameterControls =
    isInPipeline &&
    (transformer.availableDimensions.length > 0 ||
      transformer.visualParameters.length > 0);

  return (
    <div
      key={transformer.id}
      className={`${
        isInPipeline
          ? ''
          : 'px-2 py-1 rounded border transition-colors bg-gray-50 border-gray-200 hover:bg-gray-100'
      } ${!isActive && isInPipeline ? 'opacity-50' : ''} ${isVisualizing ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Header */}
      <TransformerHeader
        transformer={transformer}
        index={index}
        isInPipeline={isInPipeline}
        displayIndex={displayIndex}
        isExpanded={effectiveExpanded}
        hasBeenModified={hasBeenModified}
        isDisabled={isDisabled}
        isActive={isActive}
        onTransformerSelect={handleTransformerSelect}
        onToggleExpanded={isActive ? onToggleExpanded : undefined}
        onAddTransformer={onAddTransformer}
        onRemoveTransformer={onRemoveTransformer}
        onToggleActive={onToggleActive}
        customActions={customActions}
      />

      {/* Description */}
      <TransformerDescription
        transformer={transformer}
        isInPipeline={isInPipeline}
        isExpanded={effectiveExpanded}
      />

      {/* Metadata (for available transformers when expanded) */}
      <TransformerMetadata
        transformer={transformer}
        isInPipeline={isInPipeline}
        isExpanded={effectiveExpanded}
      />

      {/* Parameter Controls (for pipeline transformers) */}
      {hasParameterControls && isActive && (
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
              {/* Dimensions Control */}
              <DimensionsControl
                transformer={transformer}
                dimensions={parameters.dimensions}
                visualParameters={parameters.visual}
                sliderValues={sliderValues}
                onDimensionChange={handleDimensionChange}
                onSliderInput={handleSliderInput}
                onSliderChangeComplete={handleSliderChangeComplete}
                disabled={isDisabled}
                isVarianceTransformer={isVarianceTransformer}
              />

              {/* Visual Parameters Grid */}
              <VisualParametersGrid
                transformer={transformer}
                parameters={parameters.visual}
                sliderValues={sliderValues}
                onParameterChange={handleVisualParameterChange}
                onSliderInput={handleSliderInput}
                onSliderChangeComplete={handleSliderChangeComplete}
                disabled={isDisabled}
                isVarianceTransformer={isVarianceTransformer}
              />
            </div>
          </div>
        </details>
      )}

      {/* Variance Toggle */}
      {isInPipeline && hasVarianceToggle && (
        <VarianceToggle
          isVarianceFollowing={isVarianceFollowing}
          onToggleVariance={onToggleVariance}
          isVisualizing={isVisualizing}
          hasParameterControls={hasParameterControls}
        />
      )}
    </div>
  );
}
