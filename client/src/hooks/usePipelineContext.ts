import { useContext } from 'react';
import { PipelineContext } from '../contexts/PipelineContext';

export function usePipelineContext() {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error(
      'usePipelineContext must be used within a PipelineProvider',
    );
  }
  return context;
}