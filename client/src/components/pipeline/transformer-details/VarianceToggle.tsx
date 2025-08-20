
interface VarianceToggleProps {
  isVarianceFollowing?: boolean;
  onToggleVariance?: () => void;
  isVisualizing?: boolean;
  hasParameterControls: boolean;
}

export function VarianceToggle({
  isVarianceFollowing = false,
  onToggleVariance,
  isVisualizing = false,
  hasParameterControls,
}: VarianceToggleProps) {
  return (
    <div
      className={`px-4 py-2 bg-gray-50 border border-gray-200 ${
        hasParameterControls
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
  );
}