import { describe, it, expect } from 'vitest';
import type { TransformerId } from '../pipeline/transformers/transformers';
import {
  getVarianceCompoundId,
  getTransformerParameterKey,
} from './pipeline-index';

describe('compound ID utilities', () => {
  describe('getVarianceCompoundId', () => {
    it('should create compound ID for variance transformer', () => {
      expect(getVarianceCompoundId('node-size' as TransformerId)).toBe(
        'variance-node-size',
      );
      expect(getVarianceCompoundId('edge-opacity' as TransformerId)).toBe(
        'variance-edge-opacity',
      );
    });
  });

  describe('getTransformerParameterKey', () => {
    it('should return transformer ID for regular transformers', () => {
      const ids: TransformerId[] = ['node-size', 'edge-opacity'];
      expect(getTransformerParameterKey(ids, 0)).toBe('node-size');
      expect(getTransformerParameterKey(ids, 1)).toBe('edge-opacity');
    });

    it('should return compound ID for variance transformers', () => {
      const ids: TransformerId[] = [
        'node-size',
        'variance',
        'edge-opacity',
        'variance',
      ];
      expect(getTransformerParameterKey(ids, 0)).toBe('node-size');
      expect(getTransformerParameterKey(ids, 1)).toBe('variance-node-size');
      expect(getTransformerParameterKey(ids, 2)).toBe('edge-opacity');
      expect(getTransformerParameterKey(ids, 3)).toBe('variance-edge-opacity');
    });

    it('should handle variance at the start (edge case)', () => {
      const ids: TransformerId[] = ['variance', 'node-size'];
      // Variance at index 0 has no parent, so it should return 'variance'
      expect(getTransformerParameterKey(ids, 0)).toBe('variance');
      expect(getTransformerParameterKey(ids, 1)).toBe('node-size');
    });
  });
});
