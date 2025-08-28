import { useContext } from 'react';
import { CanvasSettingsContext } from '../contexts/CanvasSettingsContext';

export const useCanvasSettings = () => {
  const context = useContext(CanvasSettingsContext);
  
  if (!context) {
    throw new Error('useCanvasSettings must be used within CanvasSettingsProvider');
  }
  
  return context;
};