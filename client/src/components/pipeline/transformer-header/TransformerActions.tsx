
interface TransformerActionsProps {
  isInPipeline: boolean;
  isDisabled: boolean;
  onAddTransformer: () => void;
  onRemoveTransformer: () => void;
  customActions?: {
    removeButton?: React.ReactNode;
  };
}

export function TransformerActions({
  isInPipeline,
  isDisabled,
  onAddTransformer,
  onRemoveTransformer,
  customActions,
}: TransformerActionsProps) {
  if (isInPipeline) {
    if (customActions && 'removeButton' in customActions) {
      return <>{customActions.removeButton}</>;
    }
    return (
      <button
        className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          if (!isDisabled) {
            onRemoveTransformer();
          }
        }}
        disabled={isDisabled}
      >
        ×
      </button>
    );
  }

  return (
    <button
      className="text-gray-400 hover:text-green-500 text-xs flex-shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        if (!isDisabled) {
          onAddTransformer();
        }
      }}
      disabled={isDisabled}
    >
      +
    </button>
  );
}