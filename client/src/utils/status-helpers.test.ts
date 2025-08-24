import { describe, it, expect } from 'vitest';
import {
  isIdle,
  isLoading,
  isSuccess,
  isError,
  getStatusFlags,
  matchStatus,
  type StatusUnion,
} from './status-helpers';

describe('status-helpers', () => {
  describe('type guards', () => {
    it('should correctly identify idle state', () => {
      const idleState: StatusUnion<string> = {
        status: 'idle',
        data: null,
        error: null,
      };

      expect(isIdle(idleState)).toBe(true);
      expect(isLoading(idleState)).toBe(false);
      expect(isSuccess(idleState)).toBe(false);
      expect(isError(idleState)).toBe(false);
    });

    it('should correctly identify loading state', () => {
      const loadingState: StatusUnion<string> = {
        status: 'loading',
        data: null,
        error: null,
      };

      expect(isIdle(loadingState)).toBe(false);
      expect(isLoading(loadingState)).toBe(true);
      expect(isSuccess(loadingState)).toBe(false);
      expect(isError(loadingState)).toBe(false);
    });

    it('should correctly identify success state', () => {
      const successState: StatusUnion<string> = {
        status: 'success',
        data: 'test data',
        error: null,
      };

      expect(isIdle(successState)).toBe(false);
      expect(isLoading(successState)).toBe(false);
      expect(isSuccess(successState)).toBe(true);
      expect(isError(successState)).toBe(false);

      // Type narrowing should work
      if (isSuccess(successState)) {
        // This should not cause a TypeScript error
        expect(successState.data).toBe('test data');
      }
    });

    it('should correctly identify error state', () => {
      const errorState: StatusUnion<string> = {
        status: 'error',
        data: null,
        error: 'Something went wrong',
      };

      expect(isIdle(errorState)).toBe(false);
      expect(isLoading(errorState)).toBe(false);
      expect(isSuccess(errorState)).toBe(false);
      expect(isError(errorState)).toBe(true);

      // Type narrowing should work
      if (isError(errorState)) {
        // This should not cause a TypeScript error
        expect(errorState.error).toBe('Something went wrong');
      }
    });
  });

  describe('getStatusFlags', () => {
    it('should return correct flags for each state', () => {
      const states: [StatusUnion<string>, Record<string, boolean>][] = [
        [
          { status: 'idle', data: null, error: null },
          { isIdle: true, isLoading: false, isSuccess: false, isError: false },
        ],
        [
          { status: 'loading', data: null, error: null },
          { isIdle: false, isLoading: true, isSuccess: false, isError: false },
        ],
        [
          { status: 'success', data: 'data', error: null },
          { isIdle: false, isLoading: false, isSuccess: true, isError: false },
        ],
        [
          { status: 'error', data: null, error: 'error' },
          { isIdle: false, isLoading: false, isSuccess: false, isError: true },
        ],
      ];

      states.forEach(([state, expectedFlags]) => {
        expect(getStatusFlags(state)).toEqual(expectedFlags);
      });
    });
  });

  describe('matchStatus', () => {
    it('should call the correct handler for each state', () => {
      const states: StatusUnion<string>[] = [
        { status: 'idle', data: null, error: null },
        { status: 'loading', data: null, error: null },
        { status: 'success', data: 'test data', error: null },
        { status: 'error', data: null, error: 'test error' },
      ];

      const results = states.map((state) =>
        matchStatus(state, {
          idle: () => 'idle result',
          loading: () => 'loading result',
          success: (data) => `success: ${data}`,
          error: (err) => `error: ${err}`,
        }),
      );

      expect(results).toEqual([
        'idle result',
        'loading result',
        'success: test data',
        'error: test error',
      ]);
    });

    it('should support different return types', () => {
      const successState: StatusUnion<number> = {
        status: 'success',
        data: 42,
        error: null,
      };

      const result = matchStatus(successState, {
        idle: () => null,
        loading: () => null,
        success: (data) => data * 2,
        error: () => null,
      });

      expect(result).toBe(84);
    });
  });
});
