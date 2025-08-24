/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, type ReactNode } from 'react';
import { useFamilyTreeStore } from '../stores/family-tree.store';
import type { GedcomDataWithMetadata, LLMReadyData } from '../../../shared/types';

// Context value with convenience accessors for the state
interface FamilyTreeContextValue {
  // State status flags
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  // Direct data access
  fullData: GedcomDataWithMetadata | null;
  llmData: LLMReadyData | null;
  error: string | null;
}

const FamilyTreeContext = createContext<FamilyTreeContextValue | null>(null);

interface FamilyTreeProviderProps {
  children: ReactNode;
}

export function FamilyTreeProvider({ children }: FamilyTreeProviderProps): React.ReactElement {
  // Use the singleton store
  const [state] = useFamilyTreeStore((state) => state.context);

  // Create context value with convenience accessors
  const contextValue: FamilyTreeContextValue = {
    // Status flags
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    // Direct data access
    fullData: state.fullData,
    llmData: state.llmData,
    error: state.error,
  };

  return (
    <FamilyTreeContext.Provider value={contextValue}>
      {children}
    </FamilyTreeContext.Provider>
  );
}

// Hook to use family tree data in components
export function useFamilyTree(): FamilyTreeContextValue {
  const context = useContext(FamilyTreeContext);
  if (!context) {
    throw new Error('useFamilyTree must be used within FamilyTreeProvider');
  }
  return context;
}

// Hook to get just the full data (backward compatibility)
export function useFamilyTreeData(): GedcomDataWithMetadata | null {
  const { fullData } = useFamilyTree();
  return fullData;
}

// Hook to get dual data structure (for components that need both)
export function useDualFamilyTreeData(): { full: GedcomDataWithMetadata; llm: LLMReadyData } | null {
  const { isSuccess, fullData, llmData } = useFamilyTree();
  return isSuccess && fullData && llmData 
    ? { full: fullData, llm: llmData }
    : null;
}