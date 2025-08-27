import React, { createContext, useState, useCallback } from 'react';

interface SelectedIndividualContextType {
  selectedIndividualId: string | null;
  setSelectedIndividualId: (id: string | null) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SelectedIndividualContext = createContext<
  SelectedIndividualContextType | undefined
>(undefined);

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
