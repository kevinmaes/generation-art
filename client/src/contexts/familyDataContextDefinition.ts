import { createContext } from 'react';
import type { GedcomDataWithMetadata } from '../../../shared/types';

// Status discriminated union for family data loading states
export type FamilyDataStatus =
  | { type: 'idle'; data: null; error: null }
  | { type: 'loading'; data: null; error: null }
  | { type: 'success'; data: GedcomDataWithMetadata; error: null }
  | { type: 'error'; data: null; error: string };

// Context value uses the full discriminated union
export type FamilyDataContextValue = FamilyDataStatus & {
  refetch: () => void;
};

export const FamilyDataContext = createContext<
  FamilyDataContextValue | undefined
>(undefined);
