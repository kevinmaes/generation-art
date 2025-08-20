import type { VisualParameter } from '../../../pipeline/transformers/types';

interface VarianceAmountButtonsProps {
  param: VisualParameter;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VarianceAmountButtons({
  param,
  value,
  onChange,
  disabled = false,
}: VarianceAmountButtonsProps) {
  if (!param.options) return null;

  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1 text-left">
        {param.label}
      </label>
      <div className="inline-flex shadow-sm w-full" role="group">
        {param.options.map((option, index) => {
          const isSelected = value === option.value;
          const isFirst = index === 0;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(String(option.value))}
              disabled={disabled}
              className={`
                flex-1 px-1 py-1 text-xs font-medium transition-colors
                ${!isFirst ? 'border-l-0' : ''}
                ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 z-10'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex flex-col items-center">
                <span className="text-[11px] leading-tight">
                  {option.label.split(' ')[0]}
                </span>
                <span className="text-[9px] opacity-75">
                  {/\d+%/.exec(option.label)?.[0] ?? ''}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
