import type { VisualTransformerConfig } from '../../../pipeline/types';
import type { VisualParameterValues } from '../../../pipeline/visual-parameters';
import { ParameterSlider } from './ParameterSlider';
import { ParameterSelect } from './ParameterSelect';
import { ParameterColorPicker } from './ParameterColorPicker';
import { ParameterCheckbox } from './ParameterCheckbox';
import { ParameterNumber } from './ParameterNumber';
import { VarianceAmountButtons } from './VarianceAmountButtons';

interface VisualParametersGridProps {
  transformer: VisualTransformerConfig;
  parameters: VisualParameterValues;
  sliderValues: Record<string, string | number | boolean | undefined>;
  onParameterChange: (key: string, value: string | number | boolean) => void;
  onSliderInput: (
    key: string,
    value: string | number | boolean | undefined,
  ) => void;
  onSliderChangeComplete: (
    key: string,
    value: string | number | boolean,
  ) => void;
  disabled?: boolean;
  isVarianceTransformer?: boolean;
}

export function VisualParametersGrid({
  transformer,
  parameters,
  sliderValues,
  onParameterChange,
  onSliderInput,
  onSliderChangeComplete,
  disabled = false,
  isVarianceTransformer = false,
}: VisualParametersGridProps) {
  if (transformer.visualParameters.length === 0) {
    return null;
  }

  // Filter parameters based on whether this is a variance transformer
  const filteredParams = isVarianceTransformer
    ? transformer.visualParameters.filter(
        (p) => p.name !== 'limitToPreviousChanges',
      )
    : transformer.visualParameters;

  // Separate parameters by type for layout
  const sliderParams = filteredParams.filter(
    (param) => param.type === 'range' && param.name !== 'temperature',
  );
  const colorParams = filteredParams.filter((param) => param.type === 'color');
  const booleanParams = filteredParams.filter(
    (param) => param.type === 'boolean',
  );
  const varianceAmountParam = filteredParams.find(
    (p) => p.name === 'varianceAmount',
  );
  const varianceModeParam = filteredParams.find(
    (p) => p.name === 'varianceMode',
  );

  // Other dropdowns and number inputs (excluding variance controls)
  const rightColumnParams = filteredParams.filter((param) => {
    if (param.name === 'varianceAmount' || param.name === 'varianceMode')
      return false;
    return param.type === 'select' || param.type === 'number';
  });

  // Build left column parameters
  const leftColumnParams = [
    ...(varianceAmountParam ? [varianceAmountParam] : []),
    ...(varianceModeParam ? [varianceModeParam] : []),
    ...sliderParams,
    ...colorParams,
    ...booleanParams,
  ];

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-700 mb-2 text-left">
        Visual Parameters
      </h4>
      <div className={isVarianceTransformer ? '' : 'grid grid-cols-2 gap-4'}>
        {/* Left column */}
        {leftColumnParams.length > 0 && (
          <div className="space-y-3">
            {leftColumnParams.map((param) => {
              const value = parameters[param.name] ?? param.defaultValue;

              if (
                param.name === 'varianceAmount' &&
                param.type === 'select' &&
                param.options
              ) {
                return (
                  <VarianceAmountButtons
                    key={param.name}
                    param={param}
                    value={value as string}
                    onChange={(val) => onParameterChange(param.name, val)}
                    disabled={disabled}
                  />
                );
              }

              if (
                param.name === 'varianceMode' &&
                param.type === 'select' &&
                param.options
              ) {
                return (
                  <ParameterSelect
                    key={param.name}
                    param={param}
                    value={value as string}
                    onChange={(val) => onParameterChange(param.name, val)}
                    disabled={disabled}
                  />
                );
              }

              if (param.type === 'range') {
                return (
                  <ParameterSlider
                    key={param.name}
                    param={param}
                    value={value as number}
                    sliderValue={sliderValues[param.name] as number | undefined}
                    onInput={(val) => onSliderInput(param.name, val)}
                    onChange={(val) => onSliderChangeComplete(param.name, val)}
                    disabled={disabled}
                  />
                );
              }

              if (param.type === 'color') {
                return (
                  <ParameterColorPicker
                    key={param.name}
                    param={param}
                    value={value as string}
                    onChange={(val) => onParameterChange(param.name, val)}
                    disabled={disabled}
                  />
                );
              }

              if (param.type === 'boolean') {
                return (
                  <ParameterCheckbox
                    key={param.name}
                    param={param}
                    value={value as boolean}
                    onChange={(val) => onParameterChange(param.name, val)}
                    disabled={disabled}
                  />
                );
              }

              return null;
            })}
          </div>
        )}

        {/* Right column */}
        {rightColumnParams.length > 0 && !isVarianceTransformer && (
          <div className="space-y-3">
            {rightColumnParams.map((param) => {
              const value = parameters[param.name] ?? param.defaultValue;

              if (param.type === 'select' && param.options) {
                return (
                  <ParameterSelect
                    key={param.name}
                    param={param}
                    value={value as string}
                    onChange={(val) => onParameterChange(param.name, val)}
                    disabled={disabled}
                  />
                );
              }

              if (param.type === 'number') {
                return (
                  <ParameterNumber
                    key={param.name}
                    param={param}
                    value={value as number}
                    onChange={(val) => onParameterChange(param.name, val)}
                    disabled={disabled}
                  />
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
