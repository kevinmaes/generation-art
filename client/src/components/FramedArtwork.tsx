import React, { useRef, useCallback, useState } from 'react';
import type p5 from 'p5';
import { ArtGenerator } from './ArtGenerator';
import { Footer } from './Footer';
import { SidePanel } from './SidePanel';
import { BackgroundColorPicker } from './BackgroundColorPicker';
import { CANVAS_DIMENSIONS } from '../../../shared/constants';
import { useShareArt } from '../hooks/useShareArt';
import type { PipelineResult } from '../pipeline/pipeline';
import { useFamilyTreeData } from '../contexts/FamilyTreeContext';
import { useSelectedIndividual } from '../hooks/useSelectedIndividual';
import type { EnhancedP5 } from '../display/FamilyTreeSketch';

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
  onSetPrimaryIndividual?: (id: string) => void;
  fanChartMode?: 'ancestors' | 'descendants';
  onFanChartModeChange?: (mode: 'ancestors' | 'descendants') => void;
  hasFanChart?: boolean;
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
  onSetPrimaryIndividual,
  fanChartMode,
  onFanChartModeChange,
}: FramedArtworkProps): React.ReactElement {
  const familyTreeData = useFamilyTreeData();
  const { selectedIndividualId } = useSelectedIndividual();
  const p5InstanceRef = useRef<p5 | null>(null);
  const [showIndividuals, setShowIndividuals] = useState(true);
  const [showRelations, setShowRelations] = useState(true);
  const [visibleCounts, setVisibleCounts] = useState<{
    individuals: number;
    relations: number;
  }>({ individuals: 0, relations: 0 });

  const { shareState, exportWebCanvas } = useShareArt();

  const handleExport = useCallback((p5Instance: p5) => {
    p5InstanceRef.current = p5Instance;

    // Update visible counts when the canvas is ready
    const updateCounts = () => {
      const counts = (p5Instance as EnhancedP5).getVisibleCounts();
      setVisibleCounts(counts);
    };

    // Initial count update
    setTimeout(updateCounts, 100); // Small delay to ensure drawing is complete

    // Update counts whenever the canvas redraws
    const originalRedraw = p5Instance.redraw.bind(p5Instance);
    p5Instance.redraw = () => {
      originalRedraw();
      setTimeout(updateCounts, 50); // Small delay to ensure drawing is complete
    };
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
              Individuals{' '}
              {visibleCounts.individuals > 0 && (
                <span className="text-gray-500">
                  ({visibleCounts.individuals} visible)
                </span>
              )}
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
            <span className="text-sm font-medium text-gray-700">
              Relations{' '}
              {visibleCounts.relations > 0 && (
                <span className="text-gray-500">
                  ({visibleCounts.relations})
                </span>
              )}
            </span>
          </label>
        </div>

        {/* Statistics */}
        {familyTreeData && (
          <div className="mt-4 text-center text-sm text-gray-600">
            <span>
              Total dataset:{' '}
              {Object.keys(familyTreeData.full.individuals).length} individuals,{' '}
              {Object.keys(familyTreeData.full.families).length} families
            </span>
          </div>
        )}
      </div>

      {/* Canvas Container */}
      <div className="p-8 bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Background Color Controls - Part of frame, not canvas */}
          <div className="px-6 py-3 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
            <BackgroundColorPicker compact className="w-full" />
          </div>

          {/* Canvas Area */}
          <div className="p-6 bg-white">
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
              onSetPrimaryIndividual={onSetPrimaryIndividual}
            />
          </div>
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

      {/* Side Panel for Selected Individual */}
      {selectedIndividualId && (
        <SidePanel
          gedcomData={familyTreeData?.full ?? null}
          fanChartMode={fanChartMode}
          onFanChartModeChange={onFanChartModeChange}
          onVisualize={onVisualize}
        />
      )}
    </div>
  );
}
