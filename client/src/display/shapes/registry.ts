import type { ShapeGenerator, ShapeKind } from '../../../../shared/types';

/**
 * Shape generator registry
 *
 * Why: decouples shape authoring from rendering. Transformers only specify a
 * ShapeProfile with a `kind`; the renderer looks up the appropriate generator
 * here. New shapes can be added without touching renderer code.
 */
const generators = new Map<ShapeKind, ShapeGenerator>();

/**
 * Register a generator function for a specific `ShapeKind`.
 */
export function registerShapeGenerator(
  kind: ShapeKind,
  generator: ShapeGenerator,
): void {
  generators.set(kind, generator);
}

/**
 * Retrieve a generator, or `undefined` if not registered.
 */
export function getShapeGenerator(kind: ShapeKind): ShapeGenerator | undefined {
  return generators.get(kind);
}

/**
 * Retrieve a generator or throw a descriptive error if missing.
 */
export function ensureShapeGenerator(kind: ShapeKind): ShapeGenerator {
  const gen = generators.get(kind);
  if (!gen) throw new Error(`No shape generator registered for kind: ${kind}`);
  return gen;
}
