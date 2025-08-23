### Summary
Document React state conventions for this repo based on the assessed patterns.

### Motivation
- Clarifies when to group state, use reducers, or context
- Prevents reintroducing duplication or contradictory states

### Proposed changes
- Add a `docs/state-conventions.md` or section in `readme.md`
- Cover: grouping related state, avoiding redundant/duplicated state, status unions, useReducer vs useState, using context for shared data

### Affected files
- `docs/` or `readme.md`

### Acceptance criteria
- Documentation merged with clear examples from the codebase
- Linked from `readme.md` for visibility