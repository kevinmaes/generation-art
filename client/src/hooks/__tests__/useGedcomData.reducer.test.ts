import { gedcomDataReducer, type GedcomDataState, type GedcomDataAction } from '../useGedcomData';

// Mock data for testing
const mockGedcomData = {
  individuals: { 'I1': { id: 'I1', name: 'Test Person' } },
  families: {},
  metadata: { individualCount: 1, familyCount: 0 },
  graph: { nodes: [], edges: [] },
} as any;

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
        data: mockGedcomData,
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

      const action: GedcomDataAction = {
        type: 'fetch_succeeded',
        payload: mockGedcomData,
      };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'success',
        data: mockGedcomData,
        error: null,
      });
    });

    it('should transition from error to success', () => {
      const initialState: GedcomDataState = {
        status: 'error',
        data: null,
        error: 'Previous error',
      };

      const action: GedcomDataAction = {
        type: 'fetch_succeeded',
        payload: mockGedcomData,
      };
      const result = gedcomDataReducer(initialState, action);

      expect(result).toEqual({
        status: 'success',
        data: mockGedcomData,
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
        data: mockGedcomData,
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
        data: mockGedcomData,
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
      const states: GedcomDataState[] = [
        { status: 'idle', data: null, error: null },
        { status: 'loading', data: null, error: null },
        { status: 'success', data: mockGedcomData, error: null },
        { status: 'error', data: null, error: 'Error message' },
      ];

      const actions: GedcomDataAction[] = [
        { type: 'fetch_started' },
        { type: 'fetch_succeeded', payload: mockGedcomData },
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