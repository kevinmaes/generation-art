/**
 * Default visual metadata constants
 *
 * These constants define the default values for visual metadata properties.
 * They are used by both the pipeline initialization and visual parameters configuration
 * to ensure consistency across the system.
 */

import { CANVAS_DIMENSIONS } from '../../../../shared/constants';

// Default position (center of canvas)
export const DEFAULT_X = CANVAS_DIMENSIONS.WEB.WIDTH / 2;
export const DEFAULT_Y = CANVAS_DIMENSIONS.WEB.HEIGHT / 2;

// Default size and scale
export const DEFAULT_SIZE = 20;
export const DEFAULT_SCALE = 1.0;

// Default colors
export const DEFAULT_COLOR = '#cccccc';
export const DEFAULT_BACKGROUND_COLOR = '#ffffff';
export const DEFAULT_STROKE_COLOR = '#000000';
export const DEFAULT_OPACITY = 0.8;
export const DEFAULT_ALPHA = 1.0;

// Default shape and style
export const DEFAULT_SHAPE = 'circle' as const;
export const DEFAULT_STROKE_WEIGHT = 1;
export const DEFAULT_STROKE_STYLE = 'solid' as const;

// Default animation and motion values
export const DEFAULT_VELOCITY = { x: 0, y: 0 };
export const DEFAULT_ACCELERATION = { x: 0, y: 0 };
export const DEFAULT_ROTATION = 0;
export const DEFAULT_ROTATION_SPEED = 0;

// Default layout and grouping values
export const DEFAULT_GROUP = 'default';
export const DEFAULT_LAYER = 0;
export const DEFAULT_PRIORITY = 0;

// Default custom attributes
export const DEFAULT_CUSTOM = {};
