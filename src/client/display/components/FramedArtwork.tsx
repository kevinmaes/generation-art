import React, { useRef, useCallback } from 'react';
import type p5 from 'p5';
import { ArtGenerator } from './ArtGenerator';
import { Footer } from './Footer';
import { CANVAS_DIMENSIONS } from '../../../shared/constants';
import { useGedcomData } from '../../data-loading/hooks/useGedcomData';
import { useCanvasExport } from '../../data-loading/hooks/useCanvasExport';

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

    void exportPrintCanvas(familyData);
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

      <Footer
        width={width}
        height={height}
        onExportClick={handleExportClick}
        onPrintClick={handlePrintClick}
        exportState={exportState}
      />
    </div>
  );
}
