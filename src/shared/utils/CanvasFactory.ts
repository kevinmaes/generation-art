import type p5 from 'p5';

/**
 * Create a temporary canvas for export purposes
 */
export function createTemporaryCanvas(): HTMLElement {
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '-9999px';
  document.body.appendChild(tempContainer);
  return tempContainer;
}

/**
 * Create an export canvas with exact dimensions
 */
export function createExportCanvas(
  width: number,
  height: number,
): HTMLCanvasElement {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  return exportCanvas;
}

/**
 * Clean up a temporary canvas and its container
 */
export function cleanupTemporaryCanvas(
  container: HTMLElement,
  p5Instance?: p5,
): void {
  if (p5Instance) {
    p5Instance.remove();
  }
  if (document.body.contains(container)) {
    document.body.removeChild(container);
  }
}

/**
 * Validate canvas dimensions
 */
export function validateDimensions(width: number, height: number): boolean {
  return width > 0 && height > 0 && width <= 10000 && height <= 10000; // Reasonable max size
}

/**
 * Get canvas aspect ratio
 */
export function getAspectRatio(width: number, height: number): number {
  return width / height;
}
