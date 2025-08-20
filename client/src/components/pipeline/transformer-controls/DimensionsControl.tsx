import type { VisualTransformerConfig } from '../../../transformers/types';
import type { VisualParameterValues } from '../../../transformers/visual-parameters';
import { DIMENSIONS } from '../../../transformers/dimensions';
import { VISUAL_PARAMETERS } from '../../../transformers/visual-parameters';

interface DimensionsControlProps {
  transformer: VisualTransformerConfig;
  dimensions: { primary?: string; secondary?: string };
  visualParameters: VisualParameterValues;
  sliderValues: Record<string, string | number | boolean | undefined>;
  onDimensionChange: (type: 'primary' | 'secondary', value: string | undefined) => void;
  onSliderInput: (key: string, value: string | number | boolean | undefined) => void;
  onSliderChangeComplete: (key: string, value: string | number | boolean) => void;
  disabled?: boolean;
  isVarianceTransformer?: boolean;
}

export function DimensionsControl({
  transformer,
  dimensions,
  visualParameters,
  sliderValues,
  onDimensionChange,
  onSliderInput,
  onSliderChangeComplete,
  disabled = false,
  isVarianceTransformer = false,
}: DimensionsControlProps) {
  if (transformer.availableDimensions.length === 0 || isVarianceTransformer) {
    return null;
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-700 mb-2 text-left">
        {transformer.requiresLLM ? 'Dimensions + Temperature' : 'Dimensions'}
      </h4>

      <div className={`grid gap-2 ${transformer.requiresLLM ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {/* Primary Dimension */}
        <div>
          <label className="block text-xs text-gray-600 mb-1 text-left">
            Primary
          </label>
          <select
            value={dimensions.primary ?? transformer.defaultPrimaryDimension}
            onChange={(e) => onDimensionChange('primary', e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            disabled={disabled}
          >
            {transformer.availableDimensions.map((dimId) => (
              <option key={dimId} value={dimId}>
                {DIMENSIONS[dimId].label}
              </option>
            ))}
          </select>
        </div>

        {/* Secondary Dimension */}
        <div>
          <label className="block text-xs text-gray-600 mb-1 text-left">
            Secondary
          </label>
          <select
            value={dimensions.secondary ?? ''}
            onChange={(e) => onDimensionChange('secondary', e.target.value || undefined)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            disabled={disabled}
          >
            <option value="">No secondary dimension</option>
            {transformer.availableDimensions
              .filter((dimId) => dimId !== dimensions.primary)
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
                    : (visualParameters.temperature as number) ||
                      (VISUAL_PARAMETERS.temperature.defaultValue as number)
                }
                onInput={(e) => {
                  onSliderInput('temperature', Number((e.target as HTMLInputElement).value));
                }}
                onChange={(e) => {
                  onSliderChangeComplete('temperature', Number(e.target.value));
                }}
                className="flex-1"
                disabled={disabled}
              />
              <div className="min-w-[50px] text-right text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
                {(() => {
                  const value =
                    sliderValues.temperature !== undefined
                      ? (sliderValues.temperature as number)
                      : (visualParameters.temperature as number) ||
                        (VISUAL_PARAMETERS.temperature.defaultValue as number);
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
  );
}