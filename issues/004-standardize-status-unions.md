### Summary
Standardize status representation across data loading flows using a discriminated union to prevent contradictions.

### Motivation
- Separate `loading`/`error` flags can lead to impossible states
- A single `status` enhances predictability and reduces branching

### Proposed changes
- Adopt `status: 'idle' | 'loading' | 'success' | 'error'` (or similar) for loaders
- Apply to `useGedcomData` and any remaining loader components
- Adjust UI branches to the status model

### Affected files
- `src/hooks/useGedcomData.ts`
- `src/components/GedcomLoader.tsx` (if retained)

### Acceptance criteria
- No boolean `loading` + `error` contradictions in loader code paths
- UI consistently branches on `status`