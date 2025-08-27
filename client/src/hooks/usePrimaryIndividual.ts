import { useContext } from 'react';
import { PrimaryIndividualContext } from '../contexts/PrimaryIndividualContextValue';

export const usePrimaryIndividual = () => {
  const context = useContext(PrimaryIndividualContext);
  if (context === undefined) {
    throw new Error(
      'usePrimaryIndividual must be used within a PrimaryIndividualProvider',
    );
  }
  return context;
};
