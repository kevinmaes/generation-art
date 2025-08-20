import type { VisualParameter } from '../../../pipeline/transformers/types';

interface ParameterCheckboxProps {
  param: VisualParameter;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ParameterCheckbox({
  param,
  value,
  onChange,
  disabled = false,
}: ParameterCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="text-xs"
        disabled={disabled}
      />
      <span className="text-xs text-gray-600">{param.label}</span>
    </div>
  );
}
