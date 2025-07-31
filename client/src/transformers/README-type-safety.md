# Type Safety Guidelines for Transformers

## Problem
All transformers currently access `gedcomData.individuals[id]` without null checks, leading to potential runtime errors.

## Solution Pattern

### ❌ Unsafe Pattern (Current)
```typescript
const individual = gedcomData.individuals[individualId];
const lifespan = individual.metadata.lifespan; // 💥 Runtime error if individual is undefined
```

### ✅ Safe Pattern (Recommended)
```typescript
import { getIndividualSafe } from './utils/safe-access';

const individual = getIndividualSafe(gedcomData, individualId);
if (!individual) {
  console.warn(`Transformer: Individual ${individualId} not found`);
  return defaultValue; // Handle gracefully
}
const lifespan = individual.metadata.lifespan ?? 0; // Still use nullish coalescing for optional fields
```

## Transformers Needing Updates
- [x] node-shape (partially fixed)
- [ ] node-rotation
- [ ] node-scale  
- [ ] node-size
- [ ] node-opacity
- [ ] edge-opacity (also needs edge validation)
- [ ] horizontal-spread
- [ ] vertical-spread

## Additional TypeScript Improvements

### 1. Enable Stricter Checks
Add to `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,  // Makes Record<string, T> return T | undefined
    "strictNullChecks": true,           // Already enabled via "strict": true
    "noImplicitAny": true               // Already enabled via "strict": true
  }
}
```

### 2. Use Type Guards
```typescript
function isValidIndividual(
  individual: AugmentedIndividual | undefined
): individual is AugmentedIndividual {
  return individual !== undefined;
}
```

### 3. Runtime Validation
For critical paths, add runtime validation:
```typescript
if (!isValidTransformerContext(context)) {
  throw new Error('Invalid transformer context');
}
```

## Testing Strategy
1. Add tests with missing individuals
2. Add tests with invalid IDs
3. Add tests with circular references
4. Use property-based testing for edge cases