import p5 from 'p5';
import {
  CANVAS_DIMENSIONS,
  PRINT_SETTINGS,
  EXPORT_FORMATS,
} from '../constants';
import { createSketch } from '../sketches/FamilyTreeSketch';
import {
  createTemporaryCanvas,
  createExportCanvas,
  cleanupTemporaryCanvas,
} from '../utils/CanvasFactory';
import type { AugmentedIndividual } from '../components/types';

export interface ExportOptions {
  format?: 'png' | 'jpg';
  quality?: number;
  filename?: string;
}

export interface PrintExportOptions extends ExportOptions {
  showNames?: boolean;
  strokeWeight?: number;
  textSize?: number;
  nodeSize?: number;
}

/**
 * Export the current p5 canvas as a web-optimized image
 */
export function exportWebCanvas(
  p5Instance: p5,
  options: ExportOptions = {},
): void {
  const {
    format = EXPORT_FORMATS.PNG,
    filename = PRINT_SETTINGS.WEB_FILENAME,
  } = options;

  console.log('🖼️ Exporting web canvas...');
  console.log(
    `📏 Canvas dimensions: ${p5Instance.width} × ${p5Instance.height}`,
  );

  p5Instance.saveCanvas(filename, format);
  console.log('✅ Web export completed');
}

/**
 * Export a high-resolution print-ready version
 */
export function exportPrintCanvas(
  familyData: AugmentedIndividual[],
  options: PrintExportOptions = {},
): Promise<void> {
  const {
    format = EXPORT_FORMATS.PNG,
    filename = PRINT_SETTINGS.PRINT_FILENAME,
    showNames = true,
    strokeWeight = 0.5,
    textSize = 12,
    nodeSize = 24,
  } = options;

  return new Promise((resolve, reject) => {
    console.log('🖨️ Creating high-resolution print version...');
    console.log(
      `📏 Print dimensions: ${CANVAS_DIMENSIONS.PRINT.WIDTH} × ${CANVAS_DIMENSIONS.PRINT.HEIGHT}`,
    );

    // Create temporary container using factory
    const tempContainer = createTemporaryCanvas({
      width: CANVAS_DIMENSIONS.PRINT.WIDTH,
      height: CANVAS_DIMENSIONS.PRINT.HEIGHT,
    });

    // Create print sketch using the factory
    const printSketch = createSketch({
      config: {
        width: CANVAS_DIMENSIONS.PRINT.WIDTH,
        height: CANVAS_DIMENSIONS.PRINT.HEIGHT,
        showNames,
        strokeWeight,
        textSize,
        nodeSize,
      },
      familyData,
    });

    // Create the high-res p5 instance
    const printP5 = new p5(printSketch, tempContainer);

    // Wait for render, then save
    setTimeout(() => {
      try {
        console.log(
          `📏 Final print canvas dimensions: ${printP5.width} × ${printP5.height}`,
        );

        // Create export canvas with exact dimensions using factory
        const exportCanvas = createExportCanvas(
          CANVAS_DIMENSIONS.PRINT.WIDTH,
          CANVAS_DIMENSIONS.PRINT.HEIGHT,
        );

        const exportCtx = exportCanvas.getContext('2d');
        if (exportCtx) {
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

          const dataURL = exportCanvas.toDataURL(`image/${format}`);
          const link = document.createElement('a');
          link.download = `${filename}.${format}`;
          link.href = dataURL;
          link.click();
        }

        // Clean up using factory
        cleanupTemporaryCanvas(tempContainer, printP5);

        console.log('✅ Print export completed');
        resolve();
      } catch (error) {
        console.error('❌ Print export failed:', error);
        reject(error);
      }
    }, 100);
  });
}
