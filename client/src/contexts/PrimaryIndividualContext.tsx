import React, { createContext, useContext, useState, useCallback } from 'react';

interface PrimaryIndividualContextType {
  primaryIndividualId: string | null;
  setPrimaryIndividualId: (id: string | null) => void;
}

const PrimaryIndividualContext = createContext<PrimaryIndividualContextType | undefined>(
  undefined
);

interface PrimaryIndividualProviderProps {
  children: React.ReactNode;
  initialValue?: string | null;
}

export const PrimaryIndividualProvider: React.FC<PrimaryIndividualProviderProps> = ({
  children,
  initialValue = null,
}) => {
  const [primaryIndividualId, setPrimaryIndividualId] = useState<string | null>(initialValue);

  const handleSetPrimaryIndividualId = useCallback((id: string | null) => {
    setPrimaryIndividualId(id);
  }, []);

  return (
    <PrimaryIndividualContext.Provider
      value={{
        primaryIndividualId,
        setPrimaryIndividualId: handleSetPrimaryIndividualId,
      }}
    >
      {children}
    </PrimaryIndividualContext.Provider>
  );
};

export const usePrimaryIndividual = () => {
  const context = useContext(PrimaryIndividualContext);
  if (context === undefined) {
    throw new Error(
      'usePrimaryIndividual must be used within a PrimaryIndividualProvider'
    );
  }
  return context;
};