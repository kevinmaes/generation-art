### Summary
Retire `GedcomLoader` or align it with the reducer-based hook to avoid dual implementations.

### Motivation
- Duplicate data loading logic exists in `GedcomLoader` and `useGedcomData`
- Keeping one source of truth reduces drift and maintenance

### Proposed changes
- If unused: remove `src/components/GedcomLoader.tsx`
- If needed: refactor it to consume `useGedcomData` (reducer-based) and render based on its state

### Affected files
- `src/components/GedcomLoader.tsx`

### Acceptance criteria
- No duplicate fetching logic remains
- All references updated or component removed