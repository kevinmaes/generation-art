import React, { useRef, useCallback, useState } from 'react';
import type p5 from 'p5';
import { ArtGenerator } from './ArtGenerator';
import { Footer } from './Footer';
import { CANVAS_DIMENSIONS } from '../../../shared/constants';
import { useShareArt } from '../hooks/useShareArt';
import type { PipelineResult } from '../pipeline/pipeline';
import { useFamilyTreeData } from '../contexts/FamilyTreeContext';

interface FramedArtworkProps {
  title: string;
  subtitle?: string;
  width?: number;
  height?: number;
  pipelineResult?: PipelineResult | null;
  className?: string;
  onOpenPipelineClick?: () => void;
  onVisualize?: () => void;
  isVisualizing?: boolean;
  pipelineProgress?: {
    current: number;
    total: number;
    transformerName: string;
  } | null;
  primaryIndividualId?: string;
}

export function FramedArtwork({
  title,
  subtitle,
  width = CANVAS_DIMENSIONS.WEB.WIDTH,
  height = CANVAS_DIMENSIONS.WEB.HEIGHT,
  pipelineResult,
  className = '',
  onOpenPipelineClick,
  onVisualize,
  isVisualizing = false,
  pipelineProgress = null,
  primaryIndividualId,
}: FramedArtworkProps): React.ReactElement {
  const familyTreeData = useFamilyTreeData();
  const p5InstanceRef = useRef<p5 | null>(null);
  const [showIndividuals, setShowIndividuals] = useState(true);
  const [showRelations, setShowRelations] = useState(true);

  const { shareState, exportWebCanvas } = useShareArt();

  const handleExport = useCallback((p5Instance: p5) => {
    p5InstanceRef.current = p5Instance;
  }, []);

  const handleExportClick = useCallback(() => {
    if (p5InstanceRef.current) {
      exportWebCanvas(p5InstanceRef.current);
    }
  }, [exportWebCanvas]);

  const handlePrintClick = useCallback(() => {
    if (p5InstanceRef.current) {
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
                  Generated from ${String(Object.keys(familyTreeData?.full.individuals ?? {}).length)} individuals
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
  }, [title, subtitle, familyTreeData]);

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* Visibility Controls */}
        <div className="mt-4 flex justify-center space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showIndividuals}
              onChange={(e) => {
                setShowIndividuals(e.target.checked);
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Individuals
            </span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showRelations}
              onChange={(e) => {
                setShowRelations(e.target.checked);
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700">Relations</span>
          </label>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="p-8 bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <ArtGenerator
            width={width}
            height={height}
            pipelineResult={pipelineResult}
            showIndividuals={showIndividuals}
            showRelations={showRelations}
            onExportReady={handleExport}
            onVisualize={onVisualize}
            isVisualizing={isVisualizing}
            pipelineProgress={pipelineProgress}
            primaryIndividualId={primaryIndividualId}
            gedcomData={familyTreeData?.full}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer
        width={width}
        height={height}
        onExportClick={handleExportClick}
        onPrintClick={handlePrintClick}
        onOpenPipelineClick={
          onOpenPipelineClick ??
          (() => {
            // Empty function as default
          })
        }
        exportState={shareState}
      />
    </div>
  );
}
