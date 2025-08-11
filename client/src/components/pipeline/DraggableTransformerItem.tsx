import { useDraggable } from '@dnd-kit/core';
import type { VisualTransformerConfig } from '../../transformers/types';
import type { TransformerId } from '../../transformers/transformers';
import type { VisualParameterValues } from '../../transformers/visual-parameters';
import { TransformerItem } from './TransformerItem';

interface DraggableTransformerItemProps {
  transformer: VisualTransformerConfig;
  isSelected: boolean;
  handleTransformerSelect: (transformerId: TransformerId) => void;
  index: number;
  isInPipeline: boolean;
  onAddTransformer?: (transformerId: TransformerId) => void;
  onRemoveTransformer?: (transformerId: TransformerId) => void;
  onParameterChange?: (
    transformerId: TransformerId,
    parameters: {
      dimensions: { primary?: string; secondary?: string };
      visual: VisualParameterValues;
    },
  ) => void;
  onParameterReset?: (transformerId: TransformerId) => void;
  currentParameters?: {
    dimensions: { primary?: string; secondary?: string };
    visual: VisualParameterValues;
  };
  isVisualizing?: boolean;
  lastRunParameters?: {
    dimensions: { primary?: string; secondary?: string };
    visual: VisualParameterValues;
  };
  isExpanded?: boolean;
  onToggleExpanded?: (transformerId: string) => void;
}

export function DraggableTransformerItem(props: DraggableTransformerItemProps) {
  const { transformer, isInPipeline } = props;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: transformer.id,
      data: {
        type: 'transformer',
        transformer,
        fromAvailable: !isInPipeline,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${String(transform.x)}px, ${String(transform.y)}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50' : ''}
      {...attributes}
      {...listeners}
    >
      <TransformerItem {...props} />
    </div>
  );
}
