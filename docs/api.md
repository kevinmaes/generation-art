# API Reference

## Complex Functions

### Metadata Extraction

#### `extractIndividualMetadata(individual, context)`

**Purpose**: Extract PII-safe metadata from individual data  
**Location**: `src/cli/metadata/transformation-pipeline.ts`

```typescript
function extractIndividualMetadata(
  individual: Individual,
  context: TransformationContext,
): IndividualMetadata;
```

**Key Features**:

- Applies PII masking based on field configuration
- Validates extracted values
- Handles missing data gracefully

#### `transformGedcomDataWithMetadata(individuals, families, rootIndividual?)`

**Purpose**: Transform raw GEDCOM data into art-ready format  
**Location**: `src/cli/metadata/transformation-pipeline.ts`

```typescript
function transformGedcomDataWithMetadata(
  individuals: Individual[],
  families: Family[],
  rootIndividual?: Individual,
): GedcomDataWithMetadata;
```

**Output**: Complete data structure with metadata for all individuals and families

### Canvas Rendering

#### `createWebSketch(familyData, width, height)`

**Purpose**: Create P5.js sketch for web display  
**Location**: `src/client/display/FamilyTreeSketch.ts`

```typescript
function createWebSketch(
  familyData: AugmentedIndividual[],
  width: number,
  height: number,
): (p: p5) => void;
```

**Features**:

- Optimized for web performance
- Interactive rendering
- Responsive to window size

#### `createPrintSketch(familyData, width, height)`

**Purpose**: Create high-resolution sketch for export  
**Location**: `src/client/display/FamilyTreeSketch.ts`

```typescript
function createPrintSketch(
  familyData: AugmentedIndividual[],
  width: number,
  height: number,
): (p: p5) => void;
```

**Features**:

- High-resolution output
- Print-optimized settings
- Larger text and node sizes

### Data Loading

#### `useGedcomData({ jsonFile, onError })`

**Purpose**: React hook for loading and validating GEDCOM data  
**Location**: `src/client/data-loading/hooks/useGedcomData.ts`

```typescript
function useGedcomData({
  jsonFile: string,
  onError?: (error: string) => void
}): {
  data: AugmentedIndividual[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

**Features**:

- Automatic error handling
- Loading states
- Data validation
- Refetch capability

### Export Functions

#### `exportPrintCanvas(familyData, options)`

**Purpose**: Generate high-resolution print-ready image  
**Location**: `src/client/services/ExportService.ts`

```typescript
function exportPrintCanvas(
  familyData: AugmentedIndividual[],
  options?: PrintExportOptions,
): Promise<void>;
```

**Options**:

- `format`: 'png' | 'jpg'
- `quality`: number (1-100)
- `filename`: string
- `showNames`: boolean
- `strokeWeight`: number
- `textSize`: number
- `nodeSize`: number

## Configuration

### Metadata Field Configuration

**Location**: `src/cli/metadata/metadata-extraction-config.ts`

```typescript
interface MetadataFieldConfig {
  fieldName: string;
  scope: 'individual' | 'family' | 'tree';
  dataType: 'string' | 'number' | 'boolean' | 'integer' | 'float';
  requiresMasking: boolean;
  transform?: (context: TransformationContext) => unknown;
  maskFunction?: (value: unknown) => unknown;
  validate?: (value: unknown) => boolean;
}
```

### Canvas Configuration

**Location**: `src/shared/constants.ts`

```typescript
const CANVAS_DIMENSIONS = {
  WEB: { WIDTH: 800, HEIGHT: 640 },
  PRINT: { WIDTH: 1920, HEIGHT: 1536 },
};
```

## Error Handling

### Common Error Types

- **ParseError**: GEDCOM parsing failures
- **ValidationError**: Data validation failures
- **ExportError**: Canvas export failures

### Error Recovery

- Graceful degradation for missing data
- Fallback values for invalid metadata
- User-friendly error messages
