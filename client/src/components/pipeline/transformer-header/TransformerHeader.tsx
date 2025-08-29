import type { VisualTransformerConfig } from '../../../pipeline/types';
import type { TransformerId } from '../../../pipeline/transformers';
import { TransformerBadges } from './TransformerBadges';
import { TransformerActions } from './TransformerActions';
import { ActiveToggle } from './ActiveToggle';

interface TransformerHeaderProps {
  transformer: VisualTransformerConfig;
  index: number;
  isInPipeline: boolean;
  displayIndex?: string;
  isExpanded?: boolean;
  hasBeenModified?: boolean;
  isDisabled: boolean;
  isActive?: boolean;
  onTransformerSelect: (transformerId: TransformerId) => void;
  onToggleExpanded?: (transformerId: string) => void;
  onAddTransformer?: (transformerId: TransformerId) => void;
  onRemoveTransformer?: (transformerId: TransformerId) => void;
  onToggleActive?: () => void;
  customActions?: {
    removeButton?: React.ReactNode;
  };
}

export function TransformerHeader({
  transformer,
  index,
  isInPipeline,
  displayIndex,
  isExpanded = false,
  hasBeenModified = false,
  isDisabled,
  isActive = true,
  onTransformerSelect,
  onToggleExpanded,
  onAddTransformer,
  onRemoveTransformer,
  onToggleActive,
  customActions,
}: TransformerHeaderProps) {
  return (
    <div
      className="flex items-center w-full cursor-pointer"
      onClick={() => {
        if (!isDisabled) {
          if (isInPipeline) {
            onTransformerSelect(transformer.id);
          } else {
            onToggleExpanded?.(transformer.id);
          }
        }
      }}
    >
      <div className="flex items-center space-x-1.5 flex-1 text-left">
        {!isInPipeline && (
          <span
            className={`text-xs transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          >
            ▶
          </span>
        )}
        {isInPipeline && (
          <span className="text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded">
            {displayIndex ?? index + 1}
          </span>
        )}
        <span className="font-medium text-sm truncate">
          {transformer.name || transformer.id}
        </span>
        <TransformerBadges
          requiresLLM={transformer.requiresLLM}
          hasBeenModified={hasBeenModified}
        />
      </div>
      {isInPipeline && onToggleActive && (
        <ActiveToggle isActive={isActive} onToggle={onToggleActive} />
      )}
      <TransformerActions
        isInPipeline={isInPipeline}
        isDisabled={isDisabled}
        onAddTransformer={() => onAddTransformer?.(transformer.id)}
        onRemoveTransformer={() => onRemoveTransformer?.(transformer.id)}
        customActions={customActions}
      />
    </div>
  );
}
