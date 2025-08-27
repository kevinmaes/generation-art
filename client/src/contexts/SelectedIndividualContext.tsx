import React, { useState, useCallback } from 'react';
import { SelectedIndividualContext } from './SelectedIndividualContextValue';

export const SelectedIndividualProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [selectedIndividualId, setSelectedIndividualId] = useState<
    string | null
  >(null);

  const handleSetSelectedIndividualId = useCallback((id: string | null) => {
    setSelectedIndividualId(id);
  }, []);

  return (
    <SelectedIndividualContext.Provider
      value={{
        selectedIndividualId,
        setSelectedIndividualId: handleSetSelectedIndividualId,
      }}
    >
      {children}
    </SelectedIndividualContext.Provider>
  );
};
