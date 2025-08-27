import { createContext } from 'react';

interface SelectedIndividualContextType {
  selectedIndividualId: string | null;
  setSelectedIndividualId: (id: string | null) => void;
}

export const SelectedIndividualContext = createContext<
  SelectedIndividualContextType | undefined
>(undefined);
