# Types

## Core Types

### Individual

```typescript
interface Individual {
  id: string; // GEDCOM: @XREF@
  name: string; // GEDCOM: NAME
  birth?: { date?: string; place?: string }; // GEDCOM: BIRT.DATE, BIRT.PLAC
  death?: { date?: string; place?: string }; // GEDCOM: DEAT.DATE, DEAT.PLAC
  parents: string[]; // GEDCOM: FAMC
  spouses: string[]; // GEDCOM: FAMS
  children: string[]; // GEDCOM: CHIL
  siblings: string[]; // Computed from FAMC
}
```

### Family

```typescript
interface Family {
  id: string; // GEDCOM: @XREF@
  husband?: Individual; // GEDCOM: HUSB
  wife?: Individual; // GEDCOM: WIFE
  children: Individual[]; // GEDCOM: CHIL
}
```

### AugmentedIndividual

```typescript
interface AugmentedIndividual extends Individual {
  metadata: IndividualMetadata; // PII-safe computed data
}
```

### DualGedcomData

```typescript
interface DualGedcomData {
  full: GedcomDataWithMetadata; // Complete data with metadata
  llm: LLMReadyData; // PII-stripped data for LLM consumption
}
```

### LLMReadyData

```typescript
interface LLMReadyData {
  individuals: Record<string, AnonymizedIndividual>;
  families: Record<string, AnonymizedFamily>;
  metadata: TreeMetadata; // Safe aggregate metadata
}
```

## Metadata Types

### IndividualMetadata

```typescript
interface IndividualMetadata {
  lifespan?: number; // BIRT.DATE → DEAT.DATE
  isAlive?: boolean; // Presence of DEAT tag
  birthMonth?: number; // BIRT.DATE month
  zodiacSign?: string; // BIRT.DATE → zodiac
  generation?: number | null; // FAMC hierarchy depth
  relativeGenerationValue?: number; // Tree position (0-100)
}
```

### FamilyMetadata

```typescript
interface FamilyMetadata {
  numberOfChildren: number; // CHIL count
}
```

### TreeMetadata

```typescript
interface TreeMetadata {
  totalIndividuals?: number; // Total INDI count
  depthOfTree?: number; // Max generation depth
}
```

## GEDCOM Mappings

| TypeScript Property      | GEDCOM Tag  | Level | Example              |
| ------------------------ | ----------- | ----- | -------------------- |
| `Individual.id`          | `@XREF@`    | 0     | `0 @I1@ INDI`        |
| `Individual.name`        | `NAME`      | 1     | `1 NAME John /Doe/`  |
| `Individual.birth.date`  | `BIRT.DATE` | 2     | `2 DATE 15 JAN 1990` |
| `Individual.birth.place` | `BIRT.PLAC` | 2     | `2 PLAC New York`    |
| `Individual.death.date`  | `DEAT.DATE` | 2     | `2 DATE 20 MAR 2020` |
| `Individual.death.place` | `DEAT.PLAC` | 2     | `2 PLAC Los Angeles` |
| `Family.id`              | `@XREF@`    | 0     | `0 @F1@ FAM`         |
| `Family.husband`         | `HUSB`      | 1     | `1 HUSB @I1@`        |
| `Family.wife`            | `WIFE`      | 1     | `1 WIFE @I2@`        |
| `Family.children`        | `CHIL`      | 1     | `1 CHIL @I3@`        |

## Data Structure Design

### ID-Keyed Objects for Efficient Graph Operations

**Design Decision**: We use ID-keyed objects (`Record<string, Individual>`) instead of arrays for individuals and families because:

1. **Graph Nature**: Family trees are graphs, not linear sequences - order doesn't matter
2. **Efficient Lookups**: O(1) access by ID vs O(n) array searches
3. **Transformer Performance**: Visual transformers frequently need to look up individuals by ID
4. **Relationship Navigation**: Easy traversal of parent-child-spouse relationships

```typescript
// Efficient: O(1) lookup
const individual = gedcomData.individuals['I1'];
const family = gedcomData.families['F1'];

// vs Inefficient: O(n) lookup
const individual = gedcomData.individuals.find((ind) => ind.id === 'I1');
```

## Data Flow Types

| Stage         | Input Type                            | Output Type                           | Purpose                      |
| ------------- | ------------------------------------- | ------------------------------------- | ---------------------------- |
| **Parse**     | `string`                              | `Individual[]`, `Family[]`            | Raw GEDCOM → structured data |
| **Augment**   | `Individual[]`                        | `AugmentedIndividual[]`               | Add metadata property        |
| **Transform** | `AugmentedIndividual[]`               | `Record<string, AugmentedIndividual>` | Convert to ID-keyed objects  |
| **Display**   | `Record<string, AugmentedIndividual>` | `DisplayData`                         | Canvas layout data           |

## Type Predicates

```typescript
// Validation helpers
isNumber(value: unknown): value is number
isString(value: unknown): value is string
isBoolean(value: unknown): value is boolean
isBirthMonth(value: unknown): value is number
```

## Usage Examples

```typescript
// Parse GEDCOM
const data: GedcomData = parser.parse(gedcomText);

// Access metadata (PII-safe)
const lifespan = individual.metadata.lifespan;
const isAlive = individual.metadata.isAlive;

// Type-safe validation
if (isNumber(individual.metadata.birthMonth)) {
  // Safe to use as number
}
```
