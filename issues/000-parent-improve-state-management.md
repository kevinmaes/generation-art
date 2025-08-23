### Background
We assessed current React state patterns against recommended practices and identified scoped improvements.

### Goals
- Adopt essential React state patterns across the app
- Remove duplication and prevent contradictory states
- Improve maintainability and predictability of state transitions

### Scope
- Data fetching and status handling
- Cross-component data sharing for family data
- Export flow status handling
- Documentation of conventions

### Plan of work (tracked via child issues)
<!-- CHILDREN:START -->
Child issues will be listed here once created.
<!-- CHILDREN:END -->

### Acceptance criteria
- All child issues are completed and referenced in this parent
- Duplicate fetches for the same `jsonFile` are eliminated
- Status handling uses a single, consistent pattern (discriminated unions or reducer-based)
- `GedcomLoader` usage is resolved (retired or aligned)
- Conventions are documented in the repo

### Notes
- Prefer `useReducer` when multiple related fields change together or transitions are event-based
- Consider a `FamilyDataContext` to share one fetch result across components