import { createContext } from 'react';

interface PrimaryIndividualContextType {
  primaryIndividualId: string | null;
  setPrimaryIndividualId: (id: string | null) => void;
}

export const PrimaryIndividualContext = createContext<
  PrimaryIndividualContextType | undefined
>(undefined);
