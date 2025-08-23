import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useGedcomData } from '../hooks/useGedcomData';
import type { GedcomDataWithMetadata } from '../../../shared/types';

// Status discriminated union as mentioned in the issue requirements
type FamilyDataStatus = 
  | { type: 'idle'; data: null; error: null }
  | { type: 'loading'; data: null; error: null }
  | { type: 'success'; data: GedcomDataWithMetadata; error: null }
  | { type: 'error'; data: null; error: string };

interface FamilyDataContextValue {
  status: FamilyDataStatus['type'];
  data: GedcomDataWithMetadata | null;
  error: string | null;
  refetch: () => void;
}

const FamilyDataContext = createContext<FamilyDataContextValue | undefined>(
  undefined,
);

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
  const status: FamilyDataStatus['type'] = useMemo(() => {
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

export function useFamilyData(): FamilyDataContextValue {
  const context = useContext(FamilyDataContext);
  if (context === undefined) {
    throw new Error('useFamilyData must be used within a FamilyDataProvider');
  }
  return context;
}

// Provider component keyed by jsonFile to prevent unnecessary re-renders
const providers = new Map<string, React.ComponentType<{ children: ReactNode }>>();

interface FamilyDataProviderWrapperProps {
  jsonFile: string;
  children: ReactNode;
  onDataLoaded?: (data: GedcomDataWithMetadata) => void;
  onError?: (error: string) => void;
}

export function createKeyedFamilyDataProvider({
  jsonFile,
  children,
  onDataLoaded,
  onError,
}: FamilyDataProviderWrapperProps): React.ReactElement {
  // Create a keyed provider to ensure proper cache invalidation
  return (
    <FamilyDataProvider
      key={jsonFile}
      jsonFile={jsonFile}
      onDataLoaded={onDataLoaded}
      onError={onError}
    >
      {children}
    </FamilyDataProvider>
  );
}