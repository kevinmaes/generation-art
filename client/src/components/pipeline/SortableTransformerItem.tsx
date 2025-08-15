import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { VisualTransformerConfig } from '../../transformers/types';
import type { TransformerId } from '../../transformers/transformers';
import type { VisualParameterValues } from '../../transformers/visual-parameters';
import { TransformerItem } from './TransformerItem';
import { usePipelineContext } from '../../hooks/usePipelineContext';
import React from 'react';

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

export function SortableTransformerItem({
  transformer,
  isSelected,
  handleTransformerSelect,
  index,
  onAddTransformer,
  onRemoveTransformer,
  onParameterChange,
  onParameterReset,
  currentParameters,
  isVisualizing = false,
  lastRunParameters,
}: SortableTransformerItemProps): React.ReactElement {
  const { activeTransformerIds, onReorderTransformers } = usePipelineContext();

  // Check if this is a variance transformer
  const isVarianceTransformer = transformer.id === 'variance';

  // Check if there's a variance transformer following this one
  const isVarianceFollowing = React.useMemo(() => {
    return activeTransformerIds[index + 1] === 'variance';
  }, [activeTransformerIds, index]);

  const toggleVarianceAfter = () => {
    if (isVarianceFollowing) {
      // Find all variance transformers and remove only the one after this transformer
      const varianceIndexToRemove = index + 1;
      if (activeTransformerIds[varianceIndexToRemove] === 'variance') {
        // Create a new array without this specific variance transformer
        const newOrder = activeTransformerIds.filter(
          (_, i) => i !== varianceIndexToRemove,
        );
        onReorderTransformers(newOrder);
      }
    } else {
      // Insert variance after current transformer
      const newOrder = [...activeTransformerIds];
      newOrder.splice(index + 1, 0, 'variance');
      onReorderTransformers(newOrder);
    }
  };

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
    disabled: isVarianceTransformer, // Disable sorting for variance transformers
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Custom multi-row drag handle (only show for non-variance transformers)
  const dragHandle = !isVarianceTransformer ? (
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
  ) : null;

  // Determine styling based on whether this is a variance transformer
  const containerClassName = isVarianceTransformer
    ? `bg-gray-50/70 border-x border-b border-gray-200 rounded-b hover:bg-gray-100/70 transition-colors ${isDragging ? 'opacity-50' : ''} -mt-[1px]`
    : `bg-gray-50 border border-gray-200 ${isVarianceFollowing ? 'rounded-t border-b-gray-300' : 'rounded'} hover:bg-gray-100 transition-colors ${isDragging ? 'opacity-50' : ''}`;

  return (
    <div ref={setNodeRef} style={style} className={containerClassName}>
      <div
        className={`flex items-center ${isVarianceTransformer ? 'px-2 py-1 pl-8' : 'px-2 py-2'}`}
      >
        {dragHandle}
        <div className="flex-1">
          <TransformerItem
            transformer={transformer}
            isSelected={isSelected}
            handleTransformerSelect={handleTransformerSelect}
            index={index}
            isInPipeline={true}
            onAddTransformer={onAddTransformer}
            onRemoveTransformer={onRemoveTransformer}
            onParameterChange={onParameterChange}
            onParameterReset={onParameterReset}
            currentParameters={currentParameters}
            isVisualizing={isVisualizing}
            lastRunParameters={lastRunParameters}
            isVarianceTransformer={isVarianceTransformer}
            customActions={{
              removeButton: !isVarianceTransformer ? (
                <button
                  className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isVisualizing) {
                      onRemoveTransformer?.(transformer.id);
                    }
                  }}
                  disabled={isVisualizing}
                >
                  ×
                </button>
              ) : null,
            }}
            hasVarianceToggle={!isVarianceTransformer}
            isVarianceFollowing={isVarianceFollowing}
            onToggleVariance={toggleVarianceAfter}
          />
        </div>
      </div>
    </div>
  );
}
