import React, { useRef, useCallback } from 'react';
import p5 from 'p5';
import { ArtGenerator } from './ArtGenerator';
import { CANVAS_DIMENSIONS } from '../constants';
import { useGedcomData } from '../hooks/useGedcomData';
import { useCanvasExport } from '../hooks/useCanvasExport';

interface FramedArtworkProps {
  title: string;
  subtitle?: string;
  width?: number;
  height?: number;
  jsonFile?: string;
  className?: string;
}

export function FramedArtwork({
  title,
  subtitle,
  width = CANVAS_DIMENSIONS.WEB.WIDTH,
  height = CANVAS_DIMENSIONS.WEB.HEIGHT,
  jsonFile,
  className = '',
}: FramedArtworkProps): React.ReactElement {
  const p5InstanceRef = useRef<p5 | null>(null);

  // Get the family data for print export
  const { data: familyData } = useGedcomData({
    jsonFile: jsonFile ?? '',
    onError: () => {},
  });

  // Use the export hook
  const { exportState, exportWebCanvas, exportPrintCanvas } = useCanvasExport();

  const handleExport = useCallback((p5Instance: p5) => {
    console.log('🎨 p5 instance received:', p5Instance);
    p5InstanceRef.current = p5Instance;
  }, []);

  const handleExportClick = useCallback(() => {
    console.log('🖼️ Export PNG clicked!');
    if (p5InstanceRef.current) {
      exportWebCanvas(p5InstanceRef.current);
    }
  }, [exportWebCanvas]);

  const handlePrintClick = useCallback(() => {
    console.log('🖨️ Print Ready clicked!');
    if (!familyData) {
      console.log('❌ No family data available for print export');
      return;
    }

    exportPrintCanvas(familyData);
  }, [familyData, exportPrintCanvas]);

  return (
    <div
      className={`bg-white rounded-lg shadow-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-1">{title}</h2>
        {subtitle && (
          <p className="text-blue-100 text-sm opacity-90">{subtitle}</p>
        )}
      </div>

      {/* Frame around artwork */}
      <div className="p-8 bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <ArtGenerator
            width={width}
            height={height}
            jsonFile={jsonFile}
            onExportReady={handleExport}
          />
        </div>
      </div>

      {/* Footer with controls */}
      <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Canvas Size:</span> {width} × {height}
            px
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportClick}
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
              onClick={handlePrintClick}
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
    </div>
  );
}
