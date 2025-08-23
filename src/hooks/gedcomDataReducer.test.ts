import { describe, it, expect } from 'vitest';
import {
  gedcomDataReducer,
  initialState,
  getLoadingState,
  getErrorState,
  type GedcomDataState,
  type GedcomDataAction,
} from './gedcomDataReducer';
import type { AugmentedIndividual } from '../components/types';

// Test data
const mockIndividual: AugmentedIndividual = {
  id: 'I001',
  name: 'John Doe',
  birth: { date: '1980-01-01', place: 'New York' },
  death: {},
  parents: [],
  spouses: [],
  children: [],
  siblings: [],
};

const mockData: AugmentedIndividual[] = [mockIndividual];

describe('gedcomDataReducer', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      // ARRANGE
      const expectedState: GedcomDataState = {
        status: 'idle',
        data: null,
        error: null,
      };

      // ACT & ASSERT
      expect(initialState).toEqual(expectedState);
    });
  });

  describe('fetch_started action', () => {
    it('should transition from idle to loading', () => {
      // ARRANGE
      const state = initialState;
      const action: GedcomDataAction = { type: 'fetch_started' };

      // ACT
      const newState = gedcomDataReducer(state, action);

      // ASSERT
      expect(newState).toEqual({
        status: 'loading',
        data: null,
        error: null,
      });
    });

    it('should clear error and preserve data when starting fetch from error state', () => {
      // ARRANGE
      const state: GedcomDataState = {
        status: 'error',
        data: mockData,
        error: 'Previous error',
      };
      const action: GedcomDataAction = { type: 'fetch_started' };

      // ACT
      const newState = gedcomDataReducer(state, action);

      // ASSERT
      expect(newState).toEqual({
        status: 'loading',
        data: mockData, // Preserved
        error: null, // Cleared
      });
    });
  });

  describe('fetch_succeeded action', () => {
    it('should transition to success with data', () => {
      // ARRANGE
      const state: GedcomDataState = {
        status: 'loading',
        data: null,
        error: null,
      };
      const action: GedcomDataAction = {
        type: 'fetch_succeeded',
        payload: mockData,
      };

      // ACT
      const newState = gedcomDataReducer(state, action);

      // ASSERT
      expect(newState).toEqual({
        status: 'success',
        data: mockData,
        error: null,
      });
    });

    it('should replace existing data with new data', () => {
      // ARRANGE
      const oldData = [{ ...mockIndividual, id: 'I002', name: 'Jane Doe' }];
      const state: GedcomDataState = {
        status: 'success',
        data: oldData,
        error: null,
      };
      const action: GedcomDataAction = {
        type: 'fetch_succeeded',
        payload: mockData,
      };

      // ACT
      const newState = gedcomDataReducer(state, action);

      // ASSERT
      expect(newState).toEqual({
        status: 'success',
        data: mockData, // New data
        error: null,
      });
    });
  });

  describe('fetch_failed action', () => {
    it('should transition to error with error message', () => {
      // ARRANGE
      const state: GedcomDataState = {
        status: 'loading',
        data: null,
        error: null,
      };
      const errorMessage = 'Network error';
      const action: GedcomDataAction = {
        type: 'fetch_failed',
        payload: errorMessage,
      };

      // ACT
      const newState = gedcomDataReducer(state, action);

      // ASSERT
      expect(newState).toEqual({
        status: 'error',
        data: null, // Preserved
        error: errorMessage,
      });
    });

    it('should preserve existing data on error', () => {
      // ARRANGE
      const state: GedcomDataState = {
        status: 'loading',
        data: mockData,
        error: null,
      };
      const errorMessage = 'Fetch failed';
      const action: GedcomDataAction = {
        type: 'fetch_failed',
        payload: errorMessage,
      };

      // ACT
      const newState = gedcomDataReducer(state, action);

      // ASSERT
      expect(newState).toEqual({
        status: 'error',
        data: mockData, // Preserved
        error: errorMessage,
      });
    });
  });

  describe('refetch action', () => {
    it('should behave like fetch_started', () => {
      // ARRANGE
      const state: GedcomDataState = {
        status: 'error',
        data: mockData,
        error: 'Previous error',
      };
      const action: GedcomDataAction = { type: 'refetch' };

      // ACT
      const newState = gedcomDataReducer(state, action);

      // ASSERT
      expect(newState).toEqual({
        status: 'loading',
        data: mockData, // Preserved
        error: null, // Cleared
      });
    });

    it('should work from success state', () => {
      // ARRANGE
      const state: GedcomDataState = {
        status: 'success',
        data: mockData,
        error: null,
      };
      const action: GedcomDataAction = { type: 'refetch' };

      // ACT
      const newState = gedcomDataReducer(state, action);

      // ASSERT
      expect(newState).toEqual({
        status: 'loading',
        data: mockData, // Preserved
        error: null,
      });
    });
  });

  describe('state consistency', () => {
    it('should never have loading and error simultaneously', () => {
      // ARRANGE
      const states = [
        initialState,
        { status: 'loading' as const, data: null, error: null },
        { status: 'success' as const, data: mockData, error: null },
        { status: 'error' as const, data: null, error: 'Error message' },
      ];

      const actions: GedcomDataAction[] = [
        { type: 'fetch_started' },
        { type: 'fetch_succeeded', payload: mockData },
        { type: 'fetch_failed', payload: 'Error' },
        { type: 'refetch' },
      ];

      // ACT & ASSERT
      states.forEach((state) => {
        actions.forEach((action) => {
          const newState = gedcomDataReducer(state, action);
          
          // Should never have loading status with non-null error
          if (newState.status === 'loading') {
            expect(newState.error).toBeNull();
          }
          
          // Should never have error status without error message
          if (newState.status === 'error') {
            expect(newState.error).toBeTruthy();
          }
        });
      });
    });
  });
});

describe('helper functions', () => {
  describe('getLoadingState', () => {
    it('should return true when status is loading', () => {
      // ARRANGE
      const state: GedcomDataState = {
        status: 'loading',
        data: null,
        error: null,
      };

      // ACT
      const isLoading = getLoadingState(state);

      // ASSERT
      expect(isLoading).toBe(true);
    });

    it('should return false for non-loading states', () => {
      // ARRANGE
      const states: GedcomDataState[] = [
        { status: 'idle', data: null, error: null },
        { status: 'success', data: mockData, error: null },
        { status: 'error', data: null, error: 'Error' },
      ];

      // ACT & ASSERT
      states.forEach((state) => {
        expect(getLoadingState(state)).toBe(false);
      });
    });
  });

  describe('getErrorState', () => {
    it('should return error message when status is error', () => {
      // ARRANGE
      const errorMessage = 'Test error';
      const state: GedcomDataState = {
        status: 'error',
        data: null,
        error: errorMessage,
      };

      // ACT
      const error = getErrorState(state);

      // ASSERT
      expect(error).toBe(errorMessage);
    });

    it('should return null for non-error states', () => {
      // ARRANGE
      const states: GedcomDataState[] = [
        { status: 'idle', data: null, error: null },
        { status: 'loading', data: null, error: null },
        { status: 'success', data: mockData, error: null },
      ];

      // ACT & ASSERT
      states.forEach((state) => {
        expect(getErrorState(state)).toBeNull();
      });
    });
  });
});