# Contexts

## FamilyTreeContext

**Status**: Active - Primary data management solution

### Overview

- Provides centralized family tree data access via XState Store
- Single source of truth for all GEDCOM/family tree data
- Uses discriminated union state: `'idle' | 'loading' | 'success' | 'error'`
- Eliminates prop drilling across component tree

### Files

- `FamilyTreeContext.tsx` - Provider component with convenience hooks
- `../stores/family-tree.store.ts` - XState Store with singleton instance

### Usage

```tsx
// Already wrapped in main.tsx
// Use in any component:
const { isLoading, fullData, llmData } = useFamilyTree();

// Or specific hooks:
const gedcomData = useFamilyTreeData(); // Just full data
const dualData = useDualFamilyTreeData(); // Both full and LLM data
```

### Architecture

- App.tsx triggers data loads via `familyTreeStore.send()`
- All components read from the same store instance
- No duplicate data fetching or state synchronization issues

## PipelineContext

Manages the visual transformation pipeline state and configuration.
