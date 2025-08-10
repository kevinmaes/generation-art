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
}

export function DroppablePipeline({
  children,
  activeTransformerIds,
}: DroppablePipelineProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'active-pipeline-dropzone',
  });

  const sortableIds = activeTransformerIds.map(
    (_, index) => `pipeline-${String(index)}`,
  );

  return (
    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[100px] p-3 rounded border-2 border-dashed transition-colors ${
          isOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-transparent'
        }`}
      >
        {children}
        {activeTransformerIds.length === 0 && (
          <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
            {isOver ? 'Drop transformer here' : 'No transformers in pipeline'}
          </div>
        )}
      </div>
    </SortableContext>
  );
}
