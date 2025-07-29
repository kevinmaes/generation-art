import React from 'react';

interface FooterProps {
  width: number;
  height: number;
  onExportClick: () => void;
  onPrintClick: () => void;
  onOpenPipelineClick: () => void;
  exportState: {
    status: string;
    error: string | null;
  };
}

export function Footer({
  width,
  height,
  onExportClick,
  onPrintClick,
  onOpenPipelineClick,
  exportState,
}: FooterProps): React.ReactElement {
  return (
    <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
      <div className="flex justify-between items-center relative">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Canvas Size:</span> {width} × {height}px
        </div>
        
        {/* Centered Pipeline Button */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <button
            onClick={onOpenPipelineClick}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
          >
            Open Pipeline Manager <kbd className="ml-2 px-2 py-1 bg-purple-600 rounded text-xs">⌘D</kbd>
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExportClick}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export PNG
          </button>
          <button
            onClick={onPrintClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Ready
          </button>
        </div>
      </div>
      {(exportState.status || exportState.error) && (
        <div className="text-sm text-gray-600 mt-2">
          {exportState.error ? (
            <span className="text-red-600">{exportState.error}</span>
          ) : (
            exportState.status
          )}
        </div>
      )}
    </div>
  );
}
