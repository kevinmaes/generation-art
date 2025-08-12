import { useCallback, useState } from 'react';
import type p5 from 'p5';
import {
  exportWebCanvas as exportWebCanvasService,
  exportPrintCanvas as exportPrintCanvasService,
  type ExportOptions,
  type PrintExportOptions,
} from '../services/ExportService';
import type { GedcomDataWithMetadata } from '../../../shared/types';

export interface ShareState {
  isSharing: boolean;
  status: string;
  error: string | null;
}

export interface UseShareArtReturn {
  shareState: ShareState;
  exportWebCanvas: (p5Instance: p5, options?: ExportOptions) => void;
  exportPrintCanvas: (
    familyData: GedcomDataWithMetadata,
    options?: PrintExportOptions,
  ) => Promise<void>;
  clearStatus: () => void;
}

/**
 * Custom hook for managing art sharing functionality (export and print)
 */
export function useShareArt(): UseShareArtReturn {
  const [shareState, setShareState] = useState<ShareState>({
    isSharing: false,
    status: '',
    error: null,
  });

  const updateState = useCallback((updates: Partial<ShareState>) => {
    setShareState((prev) => ({ ...prev, ...updates }));
  }, []);

  const exportWebCanvas = useCallback(
    (p5Instance: p5, options: ExportOptions = {}) => {
      try {
        updateState({
          isSharing: true,
          status: 'Exporting web canvas...',
          error: null,
        });

        exportWebCanvasService(p5Instance, options);

        updateState({
          isSharing: false,
          status: 'Web export completed!',
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Export failed';
        updateState({
          isSharing: false,
          status: '',
          error: errorMessage,
        });
      }
    },
    [updateState],
  );

  const exportPrintCanvas = useCallback(
    async (
      familyData: GedcomDataWithMetadata,
      options: PrintExportOptions = {},
    ) => {
      try {
        updateState({
          isSharing: true,
          status: 'Creating print-ready version...',
          error: null,
        });

        await exportPrintCanvasService(familyData, options);

        updateState({
          isSharing: false,
          status: 'Print-ready export completed!',
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Print export failed';
        updateState({
          isSharing: false,
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
    shareState,
    exportWebCanvas,
    exportPrintCanvas,
    clearStatus,
  };
}
