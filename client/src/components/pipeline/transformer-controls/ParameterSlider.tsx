import type { VisualParameter } from '../../../transformers/types';

interface ParameterSliderProps {
  param: VisualParameter;
  value: number;
  sliderValue?: number;
  onInput: (value: number) => void;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ParameterSlider({
  param,
  value,
  sliderValue,
  onInput,
  onChange,
  disabled = false,
}: ParameterSliderProps) {
  const displayValue = sliderValue ?? value;

  const formatMinMax = (val: number | undefined, _isMin: boolean) => {
    if (val === undefined) return '';
    if (param.unit === '%') {
      return `${(val * 100).toFixed(0)}%`;
    } else if (param.unit === 'px') {
      return `${String(val)}px`;
    } else if (param.unit) {
      return `${String(val)}${param.unit}`;
    } else {
      return String(val);
    }
  };

  const formatDisplayValue = (val: number) => {
    if (param.formatValue) {
      return param.formatValue(val);
    }
    if (param.unit === '%') {
      return `${(val * 100).toFixed(0)}%`;
    } else if (param.unit === 'px') {
      return `${String(Math.round(val))}px`;
    } else if (param.unit) {
      return `${String(val)}${param.unit}`;
    } else if (param.step && param.step < 1) {
      return val.toFixed(1);
    } else {
      return Math.round(val).toString();
    }
  };

  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1 text-left">
        {param.label}
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="range"
            min={param.min}
            max={param.max}
            step={param.step}
            value={displayValue}
            onInput={(e) => onInput(Number((e.target as HTMLInputElement).value))}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatMinMax(param.min, true)}</span>
            <span>{formatMinMax(param.max, false)}</span>
          </div>
        </div>
        <div className="min-w-[65px] text-right text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
          {formatDisplayValue(displayValue)}
        </div>
      </div>
    </div>
  );
}