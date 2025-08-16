import type { TransformerId } from '../transformers/transformers';

/**
 * Calculate the display index for a transformer in the pipeline.
 * Regular transformers get numeric indices (1, 2, 3...)
 * Variance transformers get alphabetic sub-indices (1a, 2a, 3a...)
 */
export function calculatePipelineIndex(
  actualIndex: number,
  isVarianceTransformer: boolean,
): string {
  if (isVarianceTransformer) {
    // For variance transformers, calculate the parent transformer's index
    // Since variance always follows its parent, the parent is at actualIndex - 1
    const parentIndex = actualIndex; // The actual index is already 0-based, display is 1-based
    return `${String(parentIndex)}a`;
  }

  // For regular transformers, we need to count only non-variance transformers before this one
  // This will be handled by the caller since we need access to the full pipeline
  return String(actualIndex + 1);
}

/**
 * Calculate display indices for all transformers in a pipeline.
 * Takes into account variance transformers to assign proper indices.
 */
export function calculatePipelineIndices(
  transformerIds: TransformerId[],
): string[] {
  const indices: string[] = [];
  let mainIndex = 0;

  for (const transformerId of transformerIds) {
    const isVariance = transformerId === 'variance';

    if (isVariance) {
      // Variance transformer gets a sub-index based on the previous main index
      indices.push(`${String(mainIndex)}a`);
    } else {
      // Regular transformer gets the next main index
      mainIndex++;
      indices.push(String(mainIndex));
    }
  }

  return indices;
}

/**
 * Check if a transformer has variance attached to it.
 */
export function hasVarianceAttached(
  transformerIds: TransformerId[],
  index: number,
): boolean {
  return transformerIds[index + 1] === 'variance';
}

/**
 * Get the indices that should move together when dragging.
 * For a regular transformer with variance, returns both indices.
 * For a variance transformer, returns empty array (can't be dragged).
 * For a regular transformer without variance, returns just its index.
 */
export function getCompoundDragIndices(
  transformerIds: TransformerId[],
  draggedIndex: number,
): number[] {
  const draggedId = transformerIds[draggedIndex];

  // Variance transformers can't be dragged
  if (draggedId === 'variance') {
    return [];
  }

  // Check if this transformer has variance attached
  if (hasVarianceAttached(transformerIds, draggedIndex)) {
    return [draggedIndex, draggedIndex + 1];
  }

  // Just the single transformer
  return [draggedIndex];
}

/**
 * Reorder transformers in the pipeline, handling compound units.
 * When moving a transformer with variance, they move together.
 *
 * The toIndex represents where the item should end up in the final array.
 * For example, moving from 0 to 2 means the item at index 0 should end up at index 2.
 */
export function reorderWithCompoundUnits(
  transformerIds: TransformerId[],
  fromIndex: number,
  toIndex: number,
): TransformerId[] {
  // Can't move to same position
  if (fromIndex === toIndex) {
    return transformerIds;
  }

  const indices = getCompoundDragIndices(transformerIds, fromIndex);

  // Can't drag variance transformers
  if (indices.length === 0) {
    return transformerIds;
  }

  // Build the result array without the moved items
  const result: TransformerId[] = [];
  const itemsToMove: TransformerId[] = [];

  for (let i = 0; i < transformerIds.length; i++) {
    if (indices.includes(i)) {
      itemsToMove.push(transformerIds[i]);
    } else {
      result.push(transformerIds[i]);
    }
  }

  // Now insert the moved items at the target position
  // The target position needs to be adjusted based on where items were removed
  let insertAt = toIndex;

  if (fromIndex < toIndex) {
    // Moving forward: adjust for the items we removed
    insertAt = Math.max(0, toIndex - itemsToMove.length + 1);
  }

  // Make sure we don't insert past the end
  insertAt = Math.min(insertAt, result.length);

  // Insert the items
  result.splice(insertAt, 0, ...itemsToMove);

  return result;
}
