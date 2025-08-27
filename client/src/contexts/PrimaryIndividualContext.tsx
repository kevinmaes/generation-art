import React, { useState, useCallback } from 'react';
import { PrimaryIndividualContext } from './PrimaryIndividualContextValue';

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
