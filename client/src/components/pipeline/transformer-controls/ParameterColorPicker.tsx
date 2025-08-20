import type { VisualParameter } from '../../../transformers/types';

interface ParameterColorPickerProps {
  param: VisualParameter;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ParameterColorPicker({
  param,
  value,
  onChange,
  disabled = false,
}: ParameterColorPickerProps) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1 text-left">
        {param.label}
      </label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 border border-gray-300 rounded"
        disabled={disabled}
      />
    </div>
  );
}