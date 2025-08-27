import React, { createContext, useContext, useState, useCallback } from 'react';

interface SelectedIndividualContextType {
  selectedIndividualId: string | null;
  setSelectedIndividualId: (id: string | null) => void;
}

const SelectedIndividualContext = createContext<SelectedIndividualContextType | undefined>(
  undefined
);

export const SelectedIndividualProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedIndividualId, setSelectedIndividualId] = useState<string | null>(null);

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

export const useSelectedIndividual = () => {
  const context = useContext(SelectedIndividualContext);
  if (context === undefined) {
    throw new Error(
      'useSelectedIndividual must be used within a SelectedIndividualProvider'
    );
  }
  return context;
};