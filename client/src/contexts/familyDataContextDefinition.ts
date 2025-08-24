import { createContext } from 'react';
import type { GedcomDataWithMetadata } from '../../../shared/types';

// Status discriminated union as mentioned in the issue requirements
type FamilyDataStatus =
  | { type: 'idle'; data: null; error: null }
  | { type: 'loading'; data: null; error: null }
  | { type: 'success'; data: GedcomDataWithMetadata; error: null }
  | { type: 'error'; data: null; error: string };

export interface FamilyDataContextValue {
  status: FamilyDataStatus['type'];
  data: GedcomDataWithMetadata | null;
  error: string | null;
  refetch: () => void;
}

export const FamilyDataContext = createContext<
  FamilyDataContextValue | undefined
>(undefined);
