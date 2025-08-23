### Summary
Introduce a `FamilyDataContext` (provider + hook) to share one fetch result across components and eliminate duplicate requests.

### Motivation
- `ArtGenerator` and `FramedArtwork` both fetch the same `jsonFile`
- Centralizing data prevents duplicate network calls and aligns loading/error UI

### Proposed changes
- Create `FamilyDataProvider` keyed by `jsonFile`
- Expose `useFamilyData()` returning `{ status, data, error, refetch }`
- Refactor `FramedArtwork` and `ArtGenerator` to consume context instead of fetching separately

### Affected files
- `src/components/FramedArtwork.tsx`
- `src/components/ArtGenerator.tsx`
- `src/hooks/useGedcomData.ts` (used inside provider)
- New: `src/context/FamilyDataContext.tsx` (or similar)

### Acceptance criteria
- Only one fetch occurs per `jsonFile`
- Both components render in sync for loading/error/success
- No prop drilling beyond provider boundaries