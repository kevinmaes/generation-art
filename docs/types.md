# Type Definitions

## Overview

This document contains all the core type definitions used throughout the generation-art system, with their GEDCOM property mappings and detailed descriptions. This centralized approach mirrors the codebase's type organization and eliminates redundancy across documentation.

## Core Data Structures

### Individual

Base individual type representing a person in the family tree.

```typescript
interface Individual {
  id: string; // GEDCOM: @XREF@ (Individual ID)
  name: string; // GEDCOM: NAME tag
  birth?: { date?: string; place?: string }; // GEDCOM: BIRT.DATE, BIRT.PLAC
  death?: { date?: string; place?: string }; // GEDCOM: DEAT.DATE, DEAT.PLAC
  parents: string[]; // GEDCOM: FAMC (Family as Child) references
  spouses: string[]; // GEDCOM: FAMS (Family as Spouse) references
  children: string[]; // GEDCOM: CHIL tags in FAM records
  siblings: string[]; // GEDCOM: Derived from FAMC siblings
}
```

**Properties:**

- `id`: Unique identifier from GEDCOM XREF
- `name`: Full name parsed from NAME tag
- `birth`: Optional birth information with date and place
- `death`: Optional death information with date and place
- `parents`: Array of parent IDs derived from FAMC references
- `spouses`: Array of spouse IDs derived from FAMS references
- `children`: Array of child IDs from FAM records
- `siblings`: Array of sibling IDs computed from shared FAMC

### Family

Represents a family unit with parents and children.

```typescript
interface Family {
  id: string; // GEDCOM: @XREF@ (Family ID)
  husband?: Individual; // GEDCOM: HUSB tag
  wife?: Individual; // GEDCOM: WIFE tag
  children: Individual[]; // GEDCOM: CHIL tags
}
```

**Properties:**

- `id`: Unique family identifier from GEDCOM XREF
- `husband`: Optional husband individual reference
- `wife`: Optional wife individual reference
- `children`: Array of child individual references

### GedcomData

Base GEDCOM data structure containing all parsed information.

```typescript
interface GedcomData {
  individuals: Individual[];
  families: Family[];
}
```

**Properties:**

- `individuals`: Array of all parsed individuals
- `families`: Array of all parsed families

## Enhanced Data Structures

### AugmentedIndividual

Extended individual with computed properties for art generation.

```typescript
interface AugmentedIndividual extends Individual {
  generation?: number | null; // GEDCOM: Computed from FAMC hierarchy
  relativeGenerationValue?: number; // GEDCOM: Computed position in tree
}
```

**Additional Properties:**

- `generation`: Generation depth from root (computed from FAMC hierarchy)
- `relativeGenerationValue`: Relative position within the tree (0-1 scale)

### IndividualWithMetadata

Individual with extracted metadata for art generation.

```typescript
interface IndividualWithMetadata extends AugmentedIndividual {
  metadata: IndividualMetadata;
}
```

**Additional Properties:**

- `metadata`: Art-specific metadata extracted from individual data

## Metadata Types

### IndividualMetadata

Art-specific metadata extracted from individual data.

```typescript
interface IndividualMetadata {
  lifespan?: number; // GEDCOM: Derived from BIRT.DATE and DEAT.DATE
  isAlive?: boolean; // GEDCOM: Derived from presence/absence of DEAT tag
  birthMonth?: number; // GEDCOM: Derived from BIRT.DATE
  zodiacSign?: string; // GEDCOM: Derived from BIRT.DATE
}
```

**Properties:**

- `lifespan`: Normalized lifespan (0-1) calculated from birth to death dates
- `isAlive`: Living status based on presence of DEAT tag
- `birthMonth`: Birth month (1-12) extracted from birth date
- `zodiacSign`: Western zodiac sign calculated from birth date

### FamilyMetadata

Metadata for family relationships.

```typescript
interface FamilyMetadata {
  numberOfChildren: number; // GEDCOM: Count of CHIL tags
}
```

**Properties:**

- `numberOfChildren`: Count of children in the family

### TreeMetadata

Overall tree statistics and metadata.

```typescript
interface TreeMetadata {
  totalIndividuals: number; // GEDCOM: Count of INDI records
  totalFamilies: number; // GEDCOM: Count of FAM records
  maxGeneration: number; // Computed from FAMC hierarchy
  averageLifespan?: number; // Derived from BIRT.DATE and DEAT.DATE
  birthYearRange?: {
    // Derived from BIRT.DATE
    earliest: number;
    latest: number;
  };
}
```

**Properties:**

- `totalIndividuals`: Total count of individuals in the tree
- `totalFamilies`: Total count of families in the tree
- `maxGeneration`: Maximum generation depth found
- `averageLifespan`: Average lifespan across all deceased individuals
- `birthYearRange`: Range of birth years in the tree

## Configuration Types

### MetadataFieldConfig

Configuration for metadata extraction and transformation.

```typescript
interface MetadataFieldConfig {
  fieldName: string;
  category: 'Individual' | 'Family' | 'Tree';
  scope: 'individual' | 'family' | 'tree';
  dataType: 'string' | 'number' | 'boolean' | 'integer' | 'float';
  piiLevel: 'none' | 'low' | 'medium' | 'high';
  description: string;
  gedcomSources: string[];
  requiresMasking: boolean;
  exampleValue: unknown;
  transform?: (context: TransformationContext) => unknown;
  maskFunction?: (value: unknown) => unknown;
  validate?: (value: unknown) => boolean;
}
```

**Properties:**

- `fieldName`: Unique identifier for the metadata field
- `category`: Category of metadata (Individual, Family, or Tree)
- `scope`: Scope of the metadata (individual, family, or tree level)
- `dataType`: TypeScript data type of the field
- `piiLevel`: Privacy level indicating sensitivity
- `description`: Human-readable description
- `gedcomSources`: Array of GEDCOM tags this field derives from
- `requiresMasking`: Whether the field requires PII masking
- `exampleValue`: Example value for documentation
- `transform`: Optional transformation function
- `maskFunction`: Optional PII masking function
- `validate`: Optional validation function

### TransformationContext

Context object passed to metadata transformation functions.

```typescript
interface TransformationContext {
  individual?: AugmentedIndividual;
  family?: Family;
  allIndividuals?: AugmentedIndividual[];
  allFamilies?: Family[];
  rootIndividual?: AugmentedIndividual;
}
```

**Properties:**

- `individual`: Current individual being processed
- `family`: Current family being processed
- `allIndividuals`: All individuals in the tree
- `allFamilies`: All families in the tree
- `rootIndividual`: Root individual of the tree

## Parser Types

### GedcomLine

Represents a single line in a GEDCOM file.

```typescript
interface GedcomLine {
  level: number; // GEDCOM: Level number (0, 1, 2, etc.)
  tag: string; // GEDCOM: Tag name (INDI, NAME, BIRT, etc.)
  value: string; // GEDCOM: Tag value
  xref?: string; // GEDCOM: Cross-reference ID (@I123@)
}
```

**Properties:**

- `level`: GEDCOM level indicating hierarchy
- `tag`: GEDCOM tag identifier
- `value`: Tag value content
- `xref`: Optional cross-reference identifier

### GedcomParserFacade

Interface for GEDCOM parser implementations.

```typescript
interface GedcomParserFacade {
  parse(gedcomText: string): GedcomData;
}
```

**Methods:**

- `parse`: Parses GEDCOM text and returns structured data

## Utility Types

### Type Predicates

Runtime type checking functions for type safety.

```typescript
function isNumber(value: unknown): value is number;
function isString(value: unknown): value is string;
function isBoolean(value: unknown): value is boolean;
function isBirthMonth(value: unknown): value is number;
```

### Canvas Configuration

Configuration for P5.js canvas rendering.

```typescript
interface CanvasConfig {
  width: number;
  height: number;
  strokeWeight: number;
  textSize: number;
  nodeSize: number;
}
```

**Properties:**

- `width`: Canvas width in pixels
- `height`: Canvas height in pixels
- `strokeWeight`: Line thickness for drawing
- `textSize`: Font size for text rendering
- `nodeSize`: Size of individual nodes

## Error Types

### GedcomError

GEDCOM parsing errors.

```typescript
interface GedcomError {
  line: number;
  message: string;
  code: string;
}
```

**Properties:**

- `line`: Line number where error occurred
- `message`: Human-readable error message
- `code`: Error code for programmatic handling

### ValidationError

Data validation errors.

```typescript
interface ValidationError {
  field: string;
  value: unknown;
  message: string;
  rule: string;
}
```

**Properties:**

- `field`: Field name that failed validation
- `value`: Value that failed validation
- `message`: Human-readable error message
- `rule`: Validation rule that was violated

## Type Guards

### Individual Type Guards

```typescript
function isValidIndividual(item: unknown): item is Individual;
function isAugmentedIndividual(item: unknown): item is AugmentedIndividual;
function hasMetadata(item: unknown): item is IndividualWithMetadata;
```

### Family Type Guards

```typescript
function isValidFamily(item: unknown): item is Family;
function hasChildren(family: Family): boolean;
function isCompleteFamily(family: Family): boolean;
```

### Metadata Type Guards

```typescript
function hasValidMetadata(individual: Individual): boolean;
function hasLifespanData(individual: Individual): boolean;
function hasBirthData(individual: Individual): boolean;
```

## Usage Examples

### Creating an Individual

```typescript
const individual: Individual = {
  id: 'I123',
  name: 'John Smith',
  birth: {
    date: '15 JUN 1990',
    place: 'New York, NY',
  },
  death: {
    date: '15 JUN 2020',
    place: 'Los Angeles, CA',
  },
  parents: ['I100', 'I101'],
  spouses: ['I200'],
  children: ['I300', 'I301'],
  siblings: ['I124', 'I125'],
};
```

### Creating Metadata

```typescript
const metadata: IndividualMetadata = {
  lifespan: 0.75, // 30 years normalized
  isAlive: false, // Has death date
  birthMonth: 6, // June
  zodiacSign: 'Gemini', // June 15
};
```

### Type Checking

```typescript
function processIndividual(data: unknown): Individual | null {
  if (isValidIndividual(data)) {
    return data;
  }
  return null;
}
```

## Best Practices

### Type Safety

1. **Use type predicates** for runtime type checking
2. **Validate data** before processing
3. **Handle optional properties** gracefully
4. **Use strict typing** for all interfaces

### GEDCOM Compliance

1. **Follow GEDCOM 5.5.1** specification for tag usage
2. **Validate XREF references** before processing
3. **Handle missing optional tags** gracefully
4. **Preserve original GEDCOM structure** when possible

### Performance

1. **Use efficient data structures** for lookups
2. **Cache computed values** when possible
3. **Batch operations** for large datasets
4. **Validate incrementally** during parsing

---

**Note**: All types are designed to be compatible with GEDCOM 5.5.1 specification and optimized for generative art applications.
