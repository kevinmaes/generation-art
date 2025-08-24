import { useContext } from 'react';
import {
  FamilyDataContext,
  type FamilyDataContextValue,
} from './familyDataContextDefinition';

/**
 * Hook to access family data from context with proper type narrowing
 */
export function useFamilyData(): FamilyDataContextValue {
  const context = useContext(FamilyDataContext);

  if (context === undefined) {
    throw new Error('useFamilyData must be used within a FamilyDataProvider');
  }

  return context;
}

// Type guard helpers for discriminated union
export function isIdle(
  value: FamilyDataContextValue,
): value is FamilyDataContextValue & { type: 'idle' } {
  return value.type === 'idle';
}

export function isLoading(
  value: FamilyDataContextValue,
): value is FamilyDataContextValue & { type: 'loading' } {
  return value.type === 'loading';
}

export function isSuccess(
  value: FamilyDataContextValue,
): value is FamilyDataContextValue & { type: 'success' } {
  return value.type === 'success';
}

export function isError(
  value: FamilyDataContextValue,
): value is FamilyDataContextValue & { type: 'error' } {
  return value.type === 'error';
}

// Convenience helpers that work directly with the hook
export function useFamilyDataStatus() {
  const familyData = useFamilyData();

  return {
    isIdle: familyData.type === 'idle',
    isLoading: familyData.type === 'loading',
    isSuccess: familyData.type === 'success',
    isError: familyData.type === 'error',
    status: familyData.type,
  };
}
