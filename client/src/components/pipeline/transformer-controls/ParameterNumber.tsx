import type { VisualParameter } from '../../../pipeline/transformers/types';

interface ParameterNumberProps {
  param: VisualParameter;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ParameterNumber({
  param,
  value,
  onChange,
  disabled = false,
}: ParameterNumberProps) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1 text-left">
        {param.label}
      </label>
      <input
        type="number"
        min={param.min}
        max={param.max}
        step={param.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
        disabled={disabled}
      />
    </div>
  );
}
