import type { AugmentedIndividual } from '../components/types';

// State type with discriminated union status
export interface GedcomDataState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: AugmentedIndividual[] | null;
  error: string | null;
}

// Action types for the reducer
export type GedcomDataAction =
  | { type: 'fetch_started' }
  | { type: 'fetch_succeeded'; payload: AugmentedIndividual[] }
  | { type: 'fetch_failed'; payload: string }
  | { type: 'refetch' };

// Initial state
export const initialState: GedcomDataState = {
  status: 'idle',
  data: null,
  error: null,
};

// Pure reducer function with exhaustive action handling
export function gedcomDataReducer(
  state: GedcomDataState,
  action: GedcomDataAction,
): GedcomDataState {
  switch (action.type) {
    case 'fetch_started':
    case 'refetch':
      return {
        status: 'loading',
        data: state.data, // Preserve existing data during refetch
        error: null, // Clear any previous error
      };

    case 'fetch_succeeded':
      return {
        status: 'success',
        data: action.payload,
        error: null,
      };

    case 'fetch_failed':
      return {
        status: 'error',
        data: state.data, // Preserve existing data on error
        error: action.payload,
      };

    default: {
      // Exhaustive check - TypeScript will error if we miss any action type
      const _exhaustiveCheck: never = action;
      void _exhaustiveCheck; // Explicitly mark as used
      return state;
    }
  }
}

// Helper functions to derive boolean flags from status (for API compatibility)
export function getLoadingState(state: GedcomDataState): boolean {
  return state.status === 'loading';
}

export function getErrorState(state: GedcomDataState): string | null {
  return state.status === 'error' ? state.error : null;
}