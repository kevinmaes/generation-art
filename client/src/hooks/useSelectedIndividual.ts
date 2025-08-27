import { useContext } from 'react';
import { SelectedIndividualContext } from '../contexts/SelectedIndividualContext';

export const useSelectedIndividual = () => {
  const context = useContext(SelectedIndividualContext);
  if (context === undefined) {
    throw new Error(
      'useSelectedIndividual must be used within a SelectedIndividualProvider',
    );
  }
  return context;
};
