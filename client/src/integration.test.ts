import { CANVAS_DIMENSIONS, PRINT_SETTINGS } from '../../shared/constants';
import { getIndividualCoord } from './components/helpers';
import { describe, it, expect } from 'vitest';

describe('Integration: Constants + Helpers', () => {
  it('should work together for coordinate calculation', () => {
    const coord = getIndividualCoord(
      'test-id',
      CANVAS_DIMENSIONS.WEB.WIDTH,
      CANVAS_DIMENSIONS.WEB.HEIGHT,
    );

    expect(coord.x).toBeGreaterThanOrEqual(0);
    expect(coord.x).toBeLessThanOrEqual(CANVAS_DIMENSIONS.WEB.WIDTH);
    expect(coord.y).toBeGreaterThanOrEqual(0);
    expect(coord.y).toBeLessThanOrEqual(CANVAS_DIMENSIONS.WEB.HEIGHT);
  });

  it('should maintain aspect ratio consistency', () => {
    const webRatio = CANVAS_DIMENSIONS.WEB.WIDTH / CANVAS_DIMENSIONS.WEB.HEIGHT;
    const printRatio =
      CANVAS_DIMENSIONS.PRINT.WIDTH / CANVAS_DIMENSIONS.PRINT.HEIGHT;

    expect(webRatio).toBe(printRatio);
    expect(webRatio).toBe(1.25);
  });

  it('should calculate correct scale factor', () => {
    const scaleFactor =
      CANVAS_DIMENSIONS.PRINT.WIDTH / CANVAS_DIMENSIONS.WEB.WIDTH;
    expect(scaleFactor).toBe(2.4);
  });

  it('should generate consistent coordinates across different scales', () => {
    const webCoord = getIndividualCoord(
      'test-id',
      CANVAS_DIMENSIONS.WEB.WIDTH,
      CANVAS_DIMENSIONS.WEB.HEIGHT,
    );
    const printCoord = getIndividualCoord(
      'test-id',
      CANVAS_DIMENSIONS.PRINT.WIDTH,
      CANVAS_DIMENSIONS.PRINT.HEIGHT,
    );

    // Coordinates should scale proportionally
    const xScale = printCoord.x / webCoord.x;
    const yScale = printCoord.y / webCoord.y;

    expect(xScale).toBeCloseTo(2.4, 1); // Allow small floating point differences
    expect(yScale).toBeCloseTo(2.4, 1);
  });

  it('should have correct export filenames', () => {
    expect(PRINT_SETTINGS.WEB_FILENAME).toBe('family-tree-art-web');
    expect(PRINT_SETTINGS.PRINT_FILENAME).toBe('family-tree-art-print');
  });
});
