# ID-Keyed Data Structure Optimization

## Overview

Individuals and families are stored as ID-keyed objects (`Record<string, Individual>`) for O(1) lookups in graph operations.

## Benefits

- **Performance**: Direct property access vs array search
- **Graph Operations**: Natural fit for family tree traversal
- **Scalability**: Consistent performance regardless of tree size

## Implementation

### Data Structure

```typescript
interface GedcomData {
  individuals: Record<string, Individual>;
  families: Record<string, Family>;
}
```

### Usage

```typescript
// O(1) lookup
const individual = gedcomData.individuals['I1'];
const family = gedcomData.families['F1'];

// Direct access for relationships
const siblings = individual.siblings.map((id) => gedcomData.individuals[id]);
```

### CLI Processing

The `transformGedcomDataWithComprehensiveAnalysis()` function converts parsed arrays to ID-keyed objects during CLI processing.

## Schema Definition

Zod schemas in `shared/types/schemas.ts` define the ID-keyed structure with `z.record(z.string(), IndividualSchema)`.
