### Summary
Optionally refactor `useCanvasExport` to a reducer with explicit export transitions.

### Motivation
- Current grouped state is good; a reducer can enforce legal transitions and improve testability

### Proposed changes
- Introduce reducer with events: `web_export_started/succeeded/failed`, `print_export_started/succeeded/failed`, `clear_status`
- State tracks `status`, `error`, `isExporting` with clear invariants

### Affected files
- `src/hooks/useCanvasExport.ts`

### Acceptance criteria
- Export transitions are explicit and serializable
- No contradictory states during/after export
- Existing consumers (`FramedArtwork`, `Footer`) continue to work