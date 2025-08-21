import { describe, it, expect } from 'vitest';
import type { TransformerId } from '../pipeline/transformers';
import {
  calculatePipelineIndices,
  hasVarianceAttached,
  getCompoundDragIndices,
  reorderWithCompoundUnits,
} from './pipeline-index';

describe('pipeline-index utilities', () => {
  describe('calculatePipelineIndices', () => {
    it('should calculate correct indices for transformers without variance', () => {
      const ids: TransformerId[] = ['node-size', 'node-shape', 'edge-opacity'];
      const indices = calculatePipelineIndices(ids);
      expect(indices).toEqual(['1', '2', '3']);
    });

    it('should calculate correct indices with variance transformers', () => {
      const ids: TransformerId[] = [
        'node-size',
        'variance',
        'node-shape',
        'edge-opacity',
        'variance',
      ];
      const indices = calculatePipelineIndices(ids);
      expect(indices).toEqual(['1', '1a', '2', '3', '3a']);
    });
  });

  describe('hasVarianceAttached', () => {
    it('should return true when variance follows transformer', () => {
      const ids: TransformerId[] = ['node-size', 'variance', 'node-shape'];
      expect(hasVarianceAttached(ids, 0)).toBe(true);
      expect(hasVarianceAttached(ids, 2)).toBe(false);
    });

    it('should return false for last transformer', () => {
      const ids: TransformerId[] = ['node-size', 'node-shape'];
      expect(hasVarianceAttached(ids, 1)).toBe(false);
    });
  });

  describe('getCompoundDragIndices', () => {
    it('should return single index for transformer without variance', () => {
      const ids: TransformerId[] = ['node-size', 'node-shape', 'edge-opacity'];
      expect(getCompoundDragIndices(ids, 1)).toEqual([1]);
    });

    it('should return both indices for transformer with variance', () => {
      const ids: TransformerId[] = ['node-size', 'variance', 'node-shape'];
      expect(getCompoundDragIndices(ids, 0)).toEqual([0, 1]);
    });

    it('should return empty array for variance transformer', () => {
      const ids: TransformerId[] = ['node-size', 'variance', 'node-shape'];
      expect(getCompoundDragIndices(ids, 1)).toEqual([]);
    });
  });

  describe('reorderWithCompoundUnits', () => {
    it('should move single transformer forward correctly', () => {
      const ids: TransformerId[] = ['node-size', 'node-shape', 'edge-opacity'];
      // Moving from 0 to 2 means moving to index 2
      const result = reorderWithCompoundUnits(ids, 0, 2);
      expect(result).toEqual(['node-shape', 'edge-opacity', 'node-size']);
    });

    it('should move transformer with variance as a unit', () => {
      const ids: TransformerId[] = [
        'node-size',
        'variance',
        'node-shape',
        'edge-opacity',
      ];
      // Moving compound unit from 0 to 3 (to the end, after edge-opacity)
      const result = reorderWithCompoundUnits(ids, 0, 3);
      expect(result).toEqual([
        'node-shape',
        'edge-opacity',
        'node-size',
        'variance',
      ]);
    });

    it('should move compound unit backward correctly', () => {
      const ids: TransformerId[] = [
        'node-shape',
        'edge-opacity',
        'node-size',
        'variance',
      ];
      const result = reorderWithCompoundUnits(ids, 2, 0);
      expect(result).toEqual([
        'node-size',
        'variance',
        'node-shape',
        'edge-opacity',
      ]);
    });

    it('should not move variance transformer directly', () => {
      const ids: TransformerId[] = ['node-size', 'variance', 'node-shape'];
      const result = reorderWithCompoundUnits(ids, 1, 2);
      expect(result).toEqual(ids); // No change
    });

    it('should handle moving to same position', () => {
      const ids: TransformerId[] = ['node-size', 'variance', 'node-shape'];
      const result = reorderWithCompoundUnits(ids, 0, 0);
      expect(result).toEqual(ids); // No change
    });

    it('should handle moving compound unit between other transformers', () => {
      const ids: TransformerId[] = [
        'node-size',
        'variance',
        'node-shape',
        'edge-opacity',
        'edge-curve',
      ];
      // Moving from 0 to 2
      // We're moving a compound unit (2 items), so after removal we have:
      // ['node-shape', 'edge-opacity', 'edge-curve']
      // Moving to index 2 in a 5-item array should place it at index 1 in the 3-item array
      const result = reorderWithCompoundUnits(ids, 0, 2);
      expect(result).toEqual([
        'node-shape',
        'node-size',
        'variance',
        'edge-opacity',
        'edge-curve',
      ]);
    });
  });
});
