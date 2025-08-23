/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect } from 'vitest';
import {
  gedcomDataReducer,
  type GedcomDataState,
  type GedcomDataAction,
} from '../useGedcomData';

// Use a simplified mock that will be cast to the correct type for testing
const createMockGedcomData = () => {
  return {} as any; // Simplified for testing purposes
};

describe('gedcomDataReducer', () => {
  describe('fetch_started', () => {
    it('should transition from idle to loading', () => {
      const initialState: GedcomDataState = {
        status: 'idle',
        data: null,
        error: null,
      };

      const action: GedcomDataAction = { type: 'fetch_started' };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'loading',
        data: null,
        error: null,
      });
    });

    it('should transition from error to loading', () => {
      const initialState: GedcomDataState = {
        status: 'error',
        data: null,
        error: 'Previous error',
      };

      const action: GedcomDataAction = { type: 'fetch_started' };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'loading',
        data: null,
        error: null,
      });
    });

    it('should transition from success to loading', () => {
      const initialState: GedcomDataState = {
        status: 'success',
        data: createMockGedcomData(),
        error: null,
      };

      const action: GedcomDataAction = { type: 'fetch_started' };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'loading',
        data: null,
        error: null,
      });
    });
  });

  describe('fetch_succeeded', () => {
    it('should transition from loading to success', () => {
      const initialState: GedcomDataState = {
        status: 'loading',
        data: null,
        error: null,
      };

      const mockData = createMockGedcomData();
      const action: GedcomDataAction = {
        type: 'fetch_succeeded',
        payload: mockData,
      };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'success',
        data: mockData,
        error: null,
      });
    });

    it('should transition from error to success', () => {
      const initialState: GedcomDataState = {
        status: 'error',
        data: null,
        error: 'Previous error',
      };

      const mockData = createMockGedcomData();
      const action: GedcomDataAction = {
        type: 'fetch_succeeded',
        payload: mockData,
      };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'success',
        data: mockData,
        error: null,
      });
    });
  });

  describe('fetch_failed', () => {
    it('should transition from loading to error', () => {
      const initialState: GedcomDataState = {
        status: 'loading',
        data: null,
        error: null,
      };

      const action: GedcomDataAction = {
        type: 'fetch_failed',
        payload: 'Network error',
      };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'error',
        data: null,
        error: 'Network error',
      });
    });

    it('should transition from success to error', () => {
      const initialState: GedcomDataState = {
        status: 'success',
        data: createMockGedcomData(),
        error: null,
      };

      const action: GedcomDataAction = {
        type: 'fetch_failed',
        payload: 'Network error',
      };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'error',
        data: null,
        error: 'Network error',
      });
    });
  });

  describe('refetch', () => {
    it('should transition from error to loading', () => {
      const initialState: GedcomDataState = {
        status: 'error',
        data: null,
        error: 'Previous error',
      };

      const action: GedcomDataAction = { type: 'refetch' };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'loading',
        data: null,
        error: null,
      });
    });

    it('should transition from success to loading', () => {
      const initialState: GedcomDataState = {
        status: 'success',
        data: createMockGedcomData(),
        error: null,
      };

      const action: GedcomDataAction = { type: 'refetch' };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'loading',
        data: null,
        error: null,
      });
    });

    it('should not transition from idle state', () => {
      const initialState: GedcomDataState = {
        status: 'idle',
        data: null,
        error: null,
      };

      const action: GedcomDataAction = { type: 'refetch' };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual(initialState);
    });

    it('should not transition from loading state', () => {
      const initialState: GedcomDataState = {
        status: 'loading',
        data: null,
        error: null,
      };

      const action: GedcomDataAction = { type: 'refetch' };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual(initialState);
    });
  });

  describe('impossible states prevention', () => {
    it('should never have loading && error simultaneously', () => {
      const mockData = createMockGedcomData();
      const states: GedcomDataState[] = [
        { status: 'idle', data: null, error: null },
        { status: 'loading', data: null, error: null },
        { status: 'success', data: mockData, error: null },
        { status: 'error', data: null, error: 'Error message' },
      ];

      const actions: GedcomDataAction[] = [
        { type: 'fetch_started' },
        { type: 'fetch_succeeded', payload: mockData },
        { type: 'fetch_failed', payload: 'Error' },
        { type: 'refetch' },
      ];

      // Test all state-action combinations
      states.forEach((state) => {
        actions.forEach((action) => {
          const result = gedcomDataReducer(state, action);

          // Ensure no impossible states
          if (result.status === 'loading') {
            expect(result.error).toBeNull();
            expect(result.data).toBeNull();
          }

          if (result.status === 'success') {
            expect(result.error).toBeNull();
            expect(result.data).toBeTruthy();
          }

          if (result.status === 'error') {
            expect(result.data).toBeNull();
            expect(result.error).toBeTruthy();
          }

          if (result.status === 'idle') {
            expect(result.data).toBeNull();
            expect(result.error).toBeNull();
          }
        });
      });
    });
  });
});
