import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { VisualTransformerConfig } from '../../../transformers/types';
import type { TransformerId } from '../../../transformers/transformers';
import type { VisualParameterValues } from '../../../transformers/visual-parameters';
import { TransformerItem } from './TransformerItem';

interface SortableTransformerItemProps {
  transformer: VisualTransformerConfig;
  isSelected: boolean;
  handleTransformerSelect: (transformerId: TransformerId) => void;
  index: number;
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
}

export function SortableTransformerItem(props: SortableTransformerItemProps) {
  const { transformer, onRemoveTransformer, isVisualizing, index } = props;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `pipeline-${index}`, // Use index-based ID for sorting
    data: {
      type: 'pipeline-transformer',
      transformer,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Custom remove button with trash icon
  const customRemoveButton = (
    <button
      className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0 flex items-center"
      onClick={(e) => {
        e.stopPropagation();
        if (!isVisualizing) {
          onRemoveTransformer?.(transformer.id);
        }
      }}
      disabled={isVisualizing}
    >
      <Trash2 size={14} />
    </button>
  );

  // Custom drag handle
  const dragHandle = (
    <div
      className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex items-center"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={14} />
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start space-x-2">
        {dragHandle}
        <div className="flex-1">
          <TransformerItem
            {...props}
            isInPipeline={true}
            customActions={{
              removeButton: customRemoveButton,
            }}
          />
        </div>
      </div>
    </div>
  );
}