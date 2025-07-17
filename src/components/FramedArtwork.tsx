import React, { useRef, useCallback } from 'react';
import p5 from 'p5';
import { ArtGenerator } from './ArtGenerator';
import {
  CANVAS_DIMENSIONS,
  PRINT_SETTINGS,
  EXPORT_FORMATS,
} from '../constants';
import { getUniqueEdges, getIndividualCoord } from './helpers';
import { useGedcomData } from '../hooks/useGedcomData';

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
  const [exportStatus, setExportStatus] = React.useState<string>('');

  // Get the family data for print export
  const { data: familyData } = useGedcomData({
    jsonFile: jsonFile ?? '',
    onError: () => {},
  });

  const handleExport = useCallback((p5Instance: p5) => {
    console.log('🎨 p5 instance received:', p5Instance);
    p5InstanceRef.current = p5Instance;
  }, []);

  const handleExportClick = useCallback(() => {
    console.log('🖼️ Export PNG clicked!');
    if (p5InstanceRef.current) {
      console.log('✅ Calling saveCanvas for web export...');
      console.log(
        `📏 Web export canvas dimensions: ${p5InstanceRef.current.width} × ${p5InstanceRef.current.height}`,
      );
      p5InstanceRef.current.saveCanvas(
        PRINT_SETTINGS.WEB_FILENAME,
        EXPORT_FORMATS.PNG,
      );
      console.log('✅ Web export completed');
      setExportStatus('Web export completed!');
    } else {
      console.log('❌ No p5 instance available');
      setExportStatus('Error: No canvas available');
    }
  }, []);

  const handlePrintClick = useCallback(() => {
    console.log('🖨️ Print Ready clicked!');
    if (!familyData) {
      console.log('❌ No family data available for print export');
      setExportStatus('Error: No family data available');
      return;
    }

    console.log('✅ Creating high-resolution print version...');
    console.log(
      `📏 Print canvas dimensions: ${CANVAS_DIMENSIONS.PRINT.WIDTH} × ${CANVAS_DIMENSIONS.PRINT.HEIGHT}`,
    );

    // Create a temporary container for the high-res canvas
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    // Create a new p5 instance for high-resolution export
    const printSketch = (p: p5) => {
      p.setup = () => {
        console.log(
          `🎨 Print setup - intended: ${CANVAS_DIMENSIONS.PRINT.WIDTH} × ${CANVAS_DIMENSIONS.PRINT.HEIGHT}`,
        );

        // Set pixel density BEFORE creating canvas
        p.pixelDensity(1);

        // Create canvas with explicit renderer
        const canvas = p.createCanvas(
          CANVAS_DIMENSIONS.PRINT.WIDTH,
          CANVAS_DIMENSIONS.PRINT.HEIGHT,
          p.P2D,
        );

        // Force the canvas buffer to be exactly the size we want
        canvas.width = CANVAS_DIMENSIONS.PRINT.WIDTH;
        canvas.height = CANVAS_DIMENSIONS.PRINT.HEIGHT;

        console.log(
          `🎨 Print setup - canvas buffer: ${canvas.width} × ${canvas.height}`,
        );
        console.log(`🎨 Print setup - p5 dimensions: ${p.width} × ${p.height}`);

        p.background(255);
      };

      p.draw = () => {
        // Redraw the artwork at print resolution
        p.background(255);

        // Draw edges (lines between connected individuals)
        const edges = getUniqueEdges(familyData);
        for (const [id1, id2] of edges) {
          const coord1 = getIndividualCoord(
            id1,
            CANVAS_DIMENSIONS.PRINT.WIDTH,
            CANVAS_DIMENSIONS.PRINT.HEIGHT,
          );
          const coord2 = getIndividualCoord(
            id2,
            CANVAS_DIMENSIONS.PRINT.WIDTH,
            CANVAS_DIMENSIONS.PRINT.HEIGHT,
          );
          const strokeColor = p.color('#ccc');
          p.stroke(strokeColor);
          p.strokeWeight(0.5); // Slightly thicker for print
          p.line(coord1.x, coord1.y, coord2.x, coord2.y);
        }

        // Draw nodes (individuals)
        for (const ind of familyData) {
          const { x, y } = getIndividualCoord(
            ind.id,
            CANVAS_DIMENSIONS.PRINT.WIDTH,
            CANVAS_DIMENSIONS.PRINT.HEIGHT,
          );
          p.noStroke();
          // Use relativeGenerationValue for opacity (default to 100 if missing)
          const opacity = ind.relativeGenerationValue ?? 100;
          const colors = ['#0000ff', '#ffff00'];
          const lerpAmount = (ind.relativeGenerationValue ?? 100) / 100;
          const color = p.lerpColor(
            p.color(colors[0]),
            p.color(colors[1]),
            lerpAmount,
          );
          color.setAlpha(opacity);

          p.fill(color);

          const maxSize = 24; // Larger for print
          const size = Math.min(
            maxSize,
            24 + (ind.relativeGenerationValue ?? 0) * 12,
          );

          p.circle(x, y, size);

          // Show names for print version
          p.fill(0);
          p.textSize(12); // Larger text for print
          p.textAlign(p.CENTER);
          p.text(ind.name, x, y + 35);
        }
      };
    };

    // Create the high-res p5 instance
    const printP5 = new p5(printSketch, tempContainer);

    // Wait for the sketch to render, then save
    setTimeout(() => {
      console.log(
        `📏 Final print canvas dimensions: ${printP5.width} × ${printP5.height}`,
      );

      // Create a separate canvas with exact dimensions for export
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = CANVAS_DIMENSIONS.PRINT.WIDTH;
      exportCanvas.height = CANVAS_DIMENSIONS.PRINT.HEIGHT;

      const exportCtx = exportCanvas.getContext('2d');
      if (exportCtx) {
        // Get the p5 canvas and draw it onto our export canvas
        const p5Canvas = tempContainer.querySelector(
          'canvas',
        ) as HTMLCanvasElement;
        exportCtx.drawImage(
          p5Canvas,
          0,
          0,
          CANVAS_DIMENSIONS.PRINT.WIDTH,
          CANVAS_DIMENSIONS.PRINT.HEIGHT,
        );

        console.log(
          `📏 Export canvas dimensions: ${exportCanvas.width} × ${exportCanvas.height}`,
        );

        const dataURL = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${PRINT_SETTINGS.PRINT_FILENAME}.png`;
        link.href = dataURL;
        link.click();
      }

      // Clean up
      printP5.remove();
      document.body.removeChild(tempContainer);

      console.log('✅ Print export completed');
      setExportStatus('Print-ready export completed!');
    }, 100);
  }, [familyData]);

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
        {exportStatus && (
          <div className="text-sm text-gray-600 mt-2">{exportStatus}</div>
        )}
      </div>
    </div>
  );
}
