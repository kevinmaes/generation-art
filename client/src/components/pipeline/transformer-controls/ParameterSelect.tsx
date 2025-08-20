import type { VisualParameter } from '../../../transformers/types';

interface ParameterSelectProps {
  param: VisualParameter;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ParameterSelect({
  param,
  value,
  onChange,
  disabled = false,
}: ParameterSelectProps) {
  if (!param.options) return null;

  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1 text-left">
        {param.label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
        disabled={disabled}
      >
        {param.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}