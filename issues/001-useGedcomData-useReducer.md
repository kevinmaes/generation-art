### Summary
Refactor `useGedcomData` to use `useReducer` with a discriminated union `status` to centralize transitions and avoid contradictory states.

### Motivation
- Current separate `loading`/`error` booleans allow transient contradictions
- A reducer with event-based transitions improves clarity and testability

### Proposed changes
- Replace `useState` for `data`/`loading`/`error` with a reducer managing:
  - `status: 'idle' | 'loading' | 'success' | 'error'`
  - `data: AugmentedIndividual[] | null`
  - `error: string | null`
- Events: `fetch_started`, `fetch_succeeded(data)`, `fetch_failed(message)`, `refetch`
- Keep `refetch` API stable

### Affected files
- `src/hooks/useGedcomData.ts`

### Acceptance criteria
- Reducer implemented with exhaustive event handling
- No impossible states (e.g., `loading && error`)
- Existing consumers continue to work (`ArtGenerator`, `FramedArtwork`)
- Unit tests for reducer transitions (optional but preferred)