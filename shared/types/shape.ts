export type ShapeKind =
  | 'circle'
  | 'blob'
  | 'teardrop'
  | 'starburst'
  | 'supershape'
  | 'particleCluster'
  | 'capsule'
  | 'squircle'
  | 'polygon';

export interface ShapeProfile {
  kind: ShapeKind;
  size: { width: number; height: number };
  seed?: number;
  params?: Record<string, number | number[] | boolean | string>;
  detail?: { maxVertices?: number; tolerance?: number };
}

export interface ShapeGeometry {
  polygon: Float32Array;
  bounds: { x: number; y: number; w: number; h: number };
}

export type ShapeGenerator = (profile: ShapeProfile) => ShapeGeometry;
