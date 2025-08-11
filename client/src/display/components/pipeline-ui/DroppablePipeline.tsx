import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { TransformerId } from '../../../transformers/transformers';

interface DroppablePipelineProps {
  children: React.ReactNode;
  activeTransformerIds: TransformerId[];
  draggedOverIndex?: number | null;
  isDraggingFromAvailable?: boolean;
}

export function DroppablePipeline({
  children,
  activeTransformerIds,
  draggedOverIndex,
  isDraggingFromAvailable = false,
}: DroppablePipelineProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'active-pipeline-dropzone',
  });

  const sortableIds = activeTransformerIds.map(
    (_, index) => `pipeline-${String(index)}`,
  );

  // Convert children to array for manipulation
  const childrenArray = React.Children.toArray(children);

  return (
    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`min-h-[100px] p-2 rounded border-2 border-dashed transition-colors ${
          isOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-transparent'
        }`}
      >
        {childrenArray.map((child, index) => (
          <React.Fragment key={index}>
            {/* Show insertion indicator before this item if dragging and this is the target position */}
            {isDraggingFromAvailable && draggedOverIndex === index && (
              <div className="h-1 bg-blue-500 rounded-full my-2 animate-pulse" />
            )}
            <div className="my-2">{child}</div>
          </React.Fragment>
        ))}
        {/* Show insertion indicator at the end if dragging to the end */}
        {isDraggingFromAvailable &&
          draggedOverIndex === childrenArray.length && (
            <div className="h-1 bg-blue-500 rounded-full my-2 animate-pulse" />
          )}
        {activeTransformerIds.length === 0 && (
          <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
            {isOver ? 'Drop transformer here' : 'No transformers in pipeline'}
          </div>
        )}
      </div>
    </SortableContext>
  );
}
