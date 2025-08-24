import { useContext } from 'react';
import {
  FamilyDataContext,
  type FamilyDataContextValue,
} from './familyDataContextDefinition';

export function useFamilyData(): FamilyDataContextValue {
  const context = useContext(FamilyDataContext);
  if (context === undefined) {
    throw new Error('useFamilyData must be used within a FamilyDataProvider');
  }
  return context;
}
