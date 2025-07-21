# API Reference

## Overview

This document provides a comprehensive reference for all public APIs, functions, interfaces, and components in the generation-art system.

## Core Types

For detailed type definitions with GEDCOM property mappings, see **[Types Documentation](types.md)**.

### Data Structures

The following core types are used throughout the system:

- `Individual` - Base individual type representing a person in the family tree
- `Family` - Represents a family unit with parents and children
- `AugmentedIndividual` - Extended individual with computed properties
- `IndividualWithMetadata` - Individual with extracted metadata for art generation
- `IndividualMetadata` - Art-specific metadata extracted from individual data
- `FamilyMetadata` - Metadata for family relationships
- `TreeMetadata` - Overall tree statistics and metadata

See **[Types Documentation](types.md)** for complete interface definitions and GEDCOM property mappings.

## Parser Layer

### `GedcomParserFacade`

Abstract interface for GEDCOM parsers.

```typescript
interface GedcomParserFacade {
  parse(gedcomText: string): GedcomData;
}
```

#### `GedcomTsParserFacade`

Concrete implementation using gedcom-ts library.

```typescript
class GedcomTsParserFacade implements GedcomParserFacade {
  parse(gedcomText: string): GedcomData;
}
```

**Usage**:

```typescript
import { GedcomTsParserFacade } from './facades/GedcomParserFacade';

const parser = new GedcomTsParserFacade();
const data = parser.parse(gedcomText);
```

#### `SimpleGedcomParserFacade`

Lightweight custom parser implementation.

```typescript
class SimpleGedcomParserFacade implements GedcomParserFacade {
  parse(gedcomText: string): GedcomData;
}
```

### Parser Factory

#### `createGedcomParser(type: string): GedcomParserFacade`

Creates parser instances based on type.

```typescript
function createGedcomParser(type: 'gedcom-ts' | 'simple'): GedcomParserFacade;
```

**Usage**:

```typescript
import { createGedcomParser } from './facades/GedcomParserFacade';

const parser = createGedcomParser('gedcom-ts');
const data = parser.parse(gedcomText);
```

## Data Processing Layer

### `augmentIndividuals`

Enhances parsed data with computed properties.

```typescript
function augmentIndividuals(
  individuals: Individual[],
  families: Family[],
): AugmentedIndividual[];
```

**Parameters**:

- `individuals`: Array of basic individual objects
- `families`: Array of family objects

**Returns**: Array of augmented individuals with generation and relationship data

**Usage**:

```typescript
import { augmentIndividuals } from './tasks/augmentIndividuals';

const augmented = augmentIndividuals(individuals, families);
```

### Metadata Extraction

#### `calculateLifespan`

Calculates lifespan from birth and death dates.

```typescript
function calculateLifespan(birthDate: string, deathDate: string): number | null;
```

**Parameters**:

- `birthDate`: Birth date string (YYYY-MM-DD format)
- `deathDate`: Death date string (YYYY-MM-DD format)

**Returns**: Lifespan in years or null if invalid dates

#### `normalizeLifespan`

Normalizes lifespan relative to maximum in dataset.

```typescript
function normalizeLifespan(
  lifespan: number,
  allIndividuals: AugmentedIndividual[],
): number;
```

**Parameters**:

- `lifespan`: Raw lifespan in years
- `allIndividuals`: All individuals for normalization

**Returns**: Normalized lifespan (0-1)

#### `isIndividualAlive`

Determines if individual is alive based on death date.

```typescript
function isIndividualAlive(individual: AugmentedIndividual): boolean;
```

**Parameters**:

- `individual`: Individual to check

**Returns**: true if alive, false if deceased

#### `extractBirthMonth`

Extracts birth month from date string.

```typescript
function extractBirthMonth(birthDate: string): number | null;
```

**Parameters**:

- `birthDate`: Birth date string

**Returns**: Month number (1-12) or null if invalid

#### `calculateZodiacSign`

Calculates western zodiac sign from birth date.

```typescript
function calculateZodiacSign(birthDate: string): string | null;
```

**Parameters**:

- `birthDate`: Birth date string

**Returns**: Zodiac sign name or null if invalid

### Transformation Pipeline

#### `transformGedcomDataWithMetadata`

Main transformation function for adding metadata.

```typescript
function transformGedcomDataWithMetadata(
  individuals: Individual[],
  families: Family[],
  rootIndividual?: Individual,
): GedcomDataWithMetadata;
```

**Parameters**:

- `individuals`: Array of individuals
- `families`: Array of families
- `rootIndividual`: Optional root individual

**Returns**: Complete data structure with metadata

#### `extractIndividualMetadata`

Extracts metadata for a single individual.

```typescript
function extractIndividualMetadata(
  individual: BaseIndividual,
  context: Omit<TransformationContext, 'individual'>,
): IndividualMetadata;
```

#### `extractFamilyMetadata`

Extracts metadata for a family.

```typescript
function extractFamilyMetadata(
  family: BaseFamily,
  context: Omit<TransformationContext, 'family'>,
): FamilyMetadata;
```

#### `extractTreeMetadata`

Extracts overall tree statistics.

```typescript
function extractTreeMetadata(
  context: Omit<TransformationContext, 'individual' | 'family'>,
): TreeMetadata;
```

### PII Masking Functions

#### `maskLifespan`

Applies noise to lifespan values for privacy.

```typescript
function maskLifespan(value: number): number;
```

**Parameters**:

- `value`: Original lifespan value

**Returns**: Masked lifespan value

#### `maskBirthMonth`

Applies noise to birth month values.

```typescript
function maskBirthMonth(value: number): number;
```

**Parameters**:

- `value`: Original birth month

**Returns**: Masked birth month (1-12)

#### `maskBoolean`

Masks boolean values (currently returns original).

```typescript
function maskBoolean(value: boolean): boolean;
```

## Visualization Layer

### `FamilyTreeSketch`

P5.js sketch for family tree visualization.

#### `createWebSketch`

Creates sketch for web display.

```typescript
function createWebSketch(data: ArtData): p5;
```

**Parameters**:

- `data`: Art generation data

**Returns**: P5.js instance configured for web

#### `createPrintSketch`

Creates sketch for print export.

```typescript
function createPrintSketch(data: ArtData): p5;
```

**Parameters**:

- `data`: Art generation data

**Returns**: P5.js instance configured for print

### Canvas Export

#### `useCanvasExport`

Custom hook for canvas export functionality.

```typescript
function useCanvasExport(): {
  exportWebCanvas: (p5Instance: p5) => Promise<void>;
  exportPrintCanvas: (data: ArtData) => Promise<void>;
  isExporting: boolean;
  status: string | null;
  error: string | null;
};
```

**Returns**: Export functions and state

**Usage**:

```typescript
import { useCanvasExport } from './hooks/useCanvasExport';

const { exportWebCanvas, exportPrintCanvas, isExporting } = useCanvasExport();
```

#### `ExportService`

Service for handling export operations.

```typescript
class ExportService {
  static exportWebCanvas(p5Instance: p5): Promise<void>;
  static exportPrintCanvas(data: ArtData): Promise<void>;
}
```

### Canvas Utilities

#### `CanvasFactory`

Utility functions for canvas management.

```typescript
class CanvasFactory {
  static createTemporaryCanvas(): HTMLCanvasElement;
  static cleanupTemporaryCanvas(canvas: HTMLCanvasElement): void;
}
```

## React Components

### `ArtGenerator`

Main art generation component.

```typescript
interface ArtGeneratorProps {
  data: AugmentedIndividual[];
  onError?: (error: string) => void;
}
```

**Props**:

- `data`: Array of augmented individuals
- `onError`: Optional error callback

### `GedcomLoader`

File upload and loading component.

```typescript
interface GedcomLoaderProps {
  onDataLoaded?: (data: AugmentedIndividual[]) => void;
  onError?: (error: string) => void;
}
```

**Props**:

- `onDataLoaded`: Callback when data is loaded
- `onError`: Callback for errors

### `FramedArtwork`

Art display wrapper with metadata.

```typescript
interface FramedArtworkProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}
```

**Props**:

- `title`: Optional title
- `subtitle`: Optional subtitle
- `children`: Art content

### `Footer`

Export and control interface.

```typescript
interface FooterProps {
  canvasDimensions: { width: number; height: number };
  onExportPNG: () => void;
  onExportPrint: () => void;
  isExporting: boolean;
  status: string | null;
}
```

## Custom Hooks

### `useGedcomData`

Hook for loading and managing GEDCOM data.

```typescript
function useGedcomData(options: UseGedcomDataOptions): UseGedcomDataReturn;

interface UseGedcomDataOptions {
  jsonFile: string;
  onDataLoaded?: (data: AugmentedIndividual[]) => void;
  onError?: (error: string) => void;
}

interface UseGedcomDataReturn {
  data: AugmentedIndividual[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

**Usage**:

```typescript
import { useGedcomData } from './hooks/useGedcomData';

const { data, loading, error, refetch } = useGedcomData({
  jsonFile: '/data/family.json',
  onDataLoaded: (data) => console.log('Data loaded:', data),
  onError: (error) => console.error('Error:', error),
});
```

## Configuration

### Constants

#### `CANVAS_DIMENSIONS`

Canvas dimensions for web and print.

```typescript
export const CANVAS_DIMENSIONS = {
  web: { width: 800, height: 600 },
  print: { width: 2400, height: 1800 },
};
```

#### `PRINT_SETTINGS`

Settings for print export.

```typescript
export const PRINT_SETTINGS = {
  scaleFactor: 3,
  dpi: 300,
  filename: 'family-tree-print.png',
};
```

#### `ASPECT_RATIO`

Canvas aspect ratio.

```typescript
export const ASPECT_RATIO = 4 / 3;
```

### Metadata Configuration

#### `metadataExtractionConfig`

Configuration for metadata extraction fields.

```typescript
export const metadataExtractionConfig: Record<string, MetadataFieldConfig>;
```

**Field Configuration**:

```typescript
interface MetadataFieldConfig {
  fieldName: string;
  category: string;
  scope: MetadataScope;
  dataType: DataType;
  piiLevel: PiiLevel;
  description: string;
  gedcomSources: string[];
  transform?: (context: TransformationContext) => unknown;
  requiresMasking: boolean;
  maskFunction?: (value: unknown) => unknown;
  exampleValue?: unknown;
  validate?: (value: unknown) => boolean;
}
```

## Type Predicates

### `isNumber`

Checks if value is a valid number.

```

```
