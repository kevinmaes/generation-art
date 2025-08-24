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

  // Determine status based on loading/error/data state
  const status: FamilyDataContextValue['status'] = useMemo(() => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (data) return 'success';
    return 'idle';
  }, [loading, error, data]);

  const contextValue = useMemo<FamilyDataContextValue>(
    () => ({
      status,
      data,
      error,
      refetch,
    }),
    [status, data, error, refetch],
  );

  return (
    <FamilyDataContext.Provider value={contextValue}>
      {children}
    </FamilyDataContext.Provider>
  );
}
