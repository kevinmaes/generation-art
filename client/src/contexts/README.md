# Contexts

## FamilyDataContext

**Status**: Available but not currently used in the app.

### Overview

- Provides centralized family data sharing across components
- Eliminates duplicate network requests
- Uses status discriminated union: `'idle' | 'loading' | 'success' | 'error'`

### Files

- `FamilyDataContext.tsx` - Provider component
- `familyDataContextDefinition.ts` - Context and type definitions
- `useFamilyData.ts` - Hook for consuming context

### Usage

```tsx
// Wrap components
<FamilyDataProvider jsonFile="/data/family.json">
  <MyComponents />
</FamilyDataProvider>;

// Use in child components
const { status, data, error, refetch } = useFamilyData();
```

### Note

Currently, the app manages data directly in `App.tsx` using `useGedcomDataWithLLM` and passes data as props. The context remains available for future use if centralized data management is needed.

## PipelineContext

Manages the visual transformation pipeline state and configuration.
