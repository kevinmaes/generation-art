import React, { useRef, useCallback } from 'react';
import type p5 from 'p5';
import { ArtGenerator } from './ArtGenerator';
import { Footer } from './Footer';
import { CANVAS_DIMENSIONS } from '../../../../shared/constants';
import { useCanvasExport } from '../../data-loading/hooks/useCanvasExport';
import type { GedcomDataWithMetadata } from '../../../../shared/types';
import type { PipelineResult } from '../../transformers/pipeline';

interface FramedArtworkProps {
  title: string;
  subtitle?: string;
  width?: number;
  height?: number;
  gedcomData?: GedcomDataWithMetadata;
  pipelineResult?: PipelineResult | null;
  className?: string;
  onPipelineResult?: (result: PipelineResult | null) => void;
}

export function FramedArtwork({
  title,
  subtitle,
  width = CANVAS_DIMENSIONS.WEB.WIDTH,
  height = CANVAS_DIMENSIONS.WEB.HEIGHT,
  gedcomData,
  pipelineResult,
  className = '',
  onPipelineResult,
}: FramedArtworkProps): React.ReactElement {
  const p5InstanceRef = useRef<p5 | null>(null);

  const { exportState, exportWebCanvas } = useCanvasExport();

  const handleExport = useCallback((p5Instance: p5) => {
    p5InstanceRef.current = p5Instance;
  }, []);

  const handleExportClick = useCallback(() => {
    if (p5InstanceRef.current) {
      exportWebCanvas(p5InstanceRef.current);
    }
  }, [exportWebCanvas]);

  const handlePrintClick = useCallback(() => {
    if (p5InstanceRef.current && gedcomData) {
      // Access the canvas through the p5 instance
      const canvas = (
        p5InstanceRef.current as unknown as { canvas: HTMLCanvasElement }
      ).canvas;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const htmlContent = `
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                .print-header { text-align: center; margin-bottom: 20px; }
                .print-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                .print-subtitle { font-size: 14px; color: #666; }
                .print-info { font-size: 12px; color: #888; margin-top: 10px; }
                canvas { display: block; margin: 0 auto; border: 1px solid #ccc; }
              </style>
            </head>
            <body>
              <div class="print-header">
                <div class="print-title">${title}</div>
                ${subtitle ? `<div class="print-subtitle">${subtitle}</div>` : ''}
                <div class="print-info">
                  Generated from ${String(gedcomData.individuals.length)} individuals
                </div>
              </div>
              <canvas id="printCanvas"></canvas>
              <script>
                const canvas = document.getElementById('printCanvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = function() {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);
                };
                img.src = '${canvas.toDataURL()}';
              </script>
            </body>
          </html>
        `;
        printWindow.document.documentElement.innerHTML = htmlContent;
        printWindow.print();
      }
    }
  }, [title, subtitle, gedcomData]);

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExportClick}
              disabled={exportState.isExporting || !p5InstanceRef.current}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportState.isExporting ? 'Exporting...' : 'Export PNG'}
            </button>
            <button
              onClick={handlePrintClick}
              disabled={!p5InstanceRef.current}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="p-8 bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <ArtGenerator
            width={width}
            height={height}
            gedcomData={gedcomData}
            pipelineResult={pipelineResult}
            onExportReady={handleExport}
            onPipelineResult={onPipelineResult}
          />
        </div>
      </div>

      {/* Footer */}
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
