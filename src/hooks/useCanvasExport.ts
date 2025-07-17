import { useCallback, useState } from 'react';
import p5 from 'p5';
import type {
  ExportOptions,
  PrintExportOptions,
} from '../services/ExportService';
import type { AugmentedIndividual } from '../components/types';

export interface ExportState {
  isExporting: boolean;
  status: string;
  error: string | null;
}

export interface UseCanvasExportReturn {
  exportState: ExportState;
  exportWebCanvas: (p5Instance: p5, options?: ExportOptions) => void;
  exportPrintCanvas: (
    familyData: AugmentedIndividual[],
    options?: PrintExportOptions,
  ) => Promise<void>;
  clearStatus: () => void;
}

/**
 * Custom hook for managing canvas export functionality
 */
export function useCanvasExport(): UseCanvasExportReturn {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    status: '',
    error: null,
  });

  const updateState = useCallback((updates: Partial<ExportState>) => {
    setExportState((prev) => ({ ...prev, ...updates }));
  }, []);

  const exportWebCanvas = useCallback(
    (p5Instance: p5, options: ExportOptions = {}) => {
      try {
        updateState({
          isExporting: true,
          status: 'Exporting web canvas...',
          error: null,
        });

        exportWebCanvas(p5Instance, options);

        updateState({
          isExporting: false,
          status: 'Web export completed!',
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Export failed';
        updateState({
          isExporting: false,
          status: '',
          error: errorMessage,
        });
      }
    },
    [updateState],
  );

  const exportPrintCanvas = useCallback(
    async (
      familyData: AugmentedIndividual[],
      options: PrintExportOptions = {},
    ) => {
      try {
        updateState({
          isExporting: true,
          status: 'Creating print-ready version...',
          error: null,
        });

        await exportPrintCanvas(familyData, options);

        updateState({
          isExporting: false,
          status: 'Print-ready export completed!',
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Print export failed';
        updateState({
          isExporting: false,
          status: '',
          error: errorMessage,
        });
      }
    },
    [updateState],
  );

  const clearStatus = useCallback(() => {
    updateState({ status: '', error: null });
  }, [updateState]);

  return {
    exportState,
    exportWebCanvas,
    exportPrintCanvas,
    clearStatus,
  };
}
