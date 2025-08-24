import React, { useMemo, type ReactNode } from 'react';
import { useGedcomData } from '../hooks/useGedcomData';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import {
  FamilyDataContext,
  type FamilyDataContextValue,
} from './familyDataContextDefinition';

interface FamilyDataProviderProps {
  jsonFile: string;
  children: ReactNode;
  onDataLoaded?: (data: GedcomDataWithMetadata) => void;
  onError?: (error: string) => void;
}

export function FamilyDataProvider({
  jsonFile,
  children,
  onDataLoaded,
  onError,
}: FamilyDataProviderProps): React.ReactElement {
  const { data, loading, error, refetch } = useGedcomData({
    jsonFile,
    onDataLoaded,
    onError,
  });

  // Construct the full discriminated union value
  const contextValue = useMemo<FamilyDataContextValue>(() => {
    if (loading) {
      return {
        type: 'loading',
        data: null,
        error: null,
        refetch,
      };
    }

    if (error) {
      return {
        type: 'error',
        data: null,
        error,
        refetch,
      };
    }

    if (data) {
      return {
        type: 'success',
        data,
        error: null,
        refetch,
      };
    }

    return {
      type: 'idle',
      data: null,
      error: null,
      refetch,
    };
  }, [loading, error, data, refetch]);

  return (
    <FamilyDataContext.Provider value={contextValue}>
      {children}
    </FamilyDataContext.Provider>
  );
}
