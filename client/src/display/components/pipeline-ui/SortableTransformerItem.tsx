import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { VisualTransformerConfig } from '../../../transformers/types';
import type { TransformerId } from '../../../transformers/transformers';
import type { VisualParameterValues } from '../../../transformers/visual-parameters';
import { TransformerItem } from './TransformerItem';

// Drag handle configuration
const DRAG_HANDLE_ROWS = 2;
const DRAG_HANDLE_HEIGHT = DRAG_HANDLE_ROWS * 16; // 16px per row

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
    id: `pipeline-${String(index)}`, // Use index-based ID for sorting
    data: {
      type: 'pipeline-transformer',
      transformer,
      index,
      transformerId: transformer.id, // Store the actual transformer ID
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

  // Custom multi-row drag handle
  const dragHandle = (
    <div
      className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center min-w-6 mr-2"
      style={{ height: `${String(DRAG_HANDLE_HEIGHT)}px` }}
      {...attributes}
      {...listeners}
    >
      {Array.from({ length: DRAG_HANDLE_ROWS }, (_, i) => (
        <GripVertical key={i} size={12} className="leading-none" />
      ))}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center px-2 py-2">
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
