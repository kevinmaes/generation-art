import type { ShapeGenerator, ShapeKind } from '../../../../shared/types';

const generators = new Map<ShapeKind, ShapeGenerator>();

export function registerShapeGenerator(
  kind: ShapeKind,
  generator: ShapeGenerator,
): void {
  generators.set(kind, generator);
}

export function getShapeGenerator(kind: ShapeKind): ShapeGenerator | undefined {
  return generators.get(kind);
}

export function ensureShapeGenerator(kind: ShapeKind): ShapeGenerator {
  const gen = generators.get(kind);
  if (!gen) throw new Error(`No shape generator registered for kind: ${kind}`);
  return gen;
}
