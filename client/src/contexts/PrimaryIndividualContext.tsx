import React, { createContext, useState, useCallback } from 'react';

interface PrimaryIndividualContextType {
  primaryIndividualId: string | null;
  setPrimaryIndividualId: (id: string | null) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const PrimaryIndividualContext = createContext<
  PrimaryIndividualContextType | undefined
>(undefined);

interface PrimaryIndividualProviderProps {
  children: React.ReactNode;
  initialValue?: string | null;
}

export const PrimaryIndividualProvider: React.FC<
  PrimaryIndividualProviderProps
> = ({ children, initialValue = null }) => {
  const [primaryIndividualId, setPrimaryIndividualId] = useState<string | null>(
    initialValue,
  );

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
