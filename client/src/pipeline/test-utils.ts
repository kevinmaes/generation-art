/**
 * Test utilities for pipeline tests
 */

import { CANVAS_COLORS } from '../constants/colors';
import { CANVAS_DIMENSIONS } from '../../../shared/constants';

/**
 * Default canvas settings for tests
 */
export const DEFAULT_TEST_CANVAS = {
  width: CANVAS_DIMENSIONS.WEB.WIDTH,
  height: CANVAS_DIMENSIONS.WEB.HEIGHT,
  backgroundColor: CANVAS_COLORS.DEFAULT,
  contrastMode: 'auto' as const,
};