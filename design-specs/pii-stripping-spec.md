# PII Stripping and Masking Specification

## Overview

This specification defines the PII (Personally Identifiable Information) stripping and masking functionality that transformers use before sending data to LLMs. The purpose is to protect privacy while maintaining the structural and statistical properties of the data needed for visual metadata generation.

## Core Principles

1. **Privacy First**: All PII must be stripped or masked before LLM transmission
2. **Structural Preservation**: Maintain data relationships and hierarchy
3. **Statistical Integrity**: Preserve aggregate statistics and patterns
4. **Transformer Local**: Original data remains available locally for transformer operations
5. **LLM-Safe**: Only anonymized data is sent to external LLM services

## Function Signature

```typescript
function stripPIIForLLM(
  gedcomData: GedcomDataWithMetadata,
): AnonymizedGedcomData;
```

## PII Classification Table

| Data Field               | PII Level | Action                    | Rationale                            |
| ------------------------ | --------- | ------------------------- | ------------------------------------ |
| **Individual Names**     | High      | Strip completely          | Direct personal identification       |
| **Birth/Death Dates**    | High      | Mask to year only         | Temporal identification              |
| **Birth/Death Places**   | High      | Strip completely          | Geographic identification            |
| **Gender**               | Medium    | Keep as-is                | Statistical pattern, not identifying |
| **Family Relationships** | Medium    | Keep structure, strip IDs | Relationship patterns important      |
| **Generation Numbers**   | Low       | Keep as-is                | Structural metadata                  |
| **Lifespan Values**      | Medium    | Normalize to 0-1 range    | Statistical pattern, not absolute    |
| **Zodiac Signs**         | Low       | Keep as-is                | Statistical pattern                  |
| **Birth Months**         | Medium    | Keep as-is                | Seasonal patterns important          |
| **Metadata Statistics**  | Low       | Keep as-is                | Aggregate data, not individual       |

## Detailed Field Specifications

### Individual Data

#### High PII Fields (Strip Completely)

- `name`: Replace with `"Individual_<ID>"` or `"Person_<generation>_<index>"`
- `birth.date`: Strip completely
- `death.date`: Strip completely
- `birth.place`: Strip completely
- `death.place`: Strip completely

#### Medium PII Fields (Mask/Transform)

- `birth.date`: Extract only year → `{ year: 1980 }`
- `death.date`: Extract only year → `{ year: 2020 }`
- `lifespan`: Normalize to 0-1 range, remove absolute values

#### Low PII Fields (Keep As-Is)

- `gender`: Keep `'M' | 'F' | 'U'`
- `generation`: Keep numeric value
- `relativeGenerationValue`: Keep 0-1 normalized value
- `birthMonth`: Keep 1-12 value
- `zodiacSign`: Keep string value
- `isAlive`: Keep boolean value

### Family Data

#### High PII Fields (Strip Completely)

- Family-specific names or identifiers
- Marriage dates (if specific)
- Marriage places

#### Medium PII Fields (Mask/Transform)

- Marriage dates: Extract only year
- Family size: Keep as numeric, strip individual details

#### Low PII Fields (Keep As-Is)

- Family structure (parent-child relationships)
- Sibling relationships
- Family metadata statistics

### Tree-Level Metadata

#### Keep All (Low PII Risk)

- `graphStructure`: All fields
- `temporalPatterns`: All aggregate statistics
- `geographicPatterns`: All aggregate statistics
- `demographics`: All aggregate statistics
- `relationships`: All aggregate statistics
- `edges`: All structural data
- `edgeAnalysis`: All aggregate statistics
- `summary`: All aggregate statistics

## Implementation Strategy

### Phase 1: Basic Stripping

1. Create `AnonymizedIndividual` interface
2. Create `AnonymizedGedcomData` interface
3. Implement basic name and date stripping
4. Add unit tests

### Phase 2: Advanced Masking

1. Implement date masking (year-only)
2. Implement lifespan normalization
3. Add statistical preservation checks
4. Add integration tests

### Phase 3: Validation & Safety

1. Add PII detection validation
2. Add structural integrity checks
3. Add performance benchmarks
4. Add comprehensive test coverage

## Usage Pattern

```typescript
// In transformer
export async function someTransformer(context: TransformerContext) {
  const { gedcomData } = context;

  // Keep original data for local operations
  const originalData = gedcomData;

  // Strip PII for LLM calls
  const anonymizedData = stripPIIForLLM(gedcomData);

  // Send to LLM
  const llmResponse = await callLLM({
    prompt: 'Analyze this family tree structure...',
    data: anonymizedData,
  });

  // Use LLM response to modify visual metadata
  return {
    visualMetadata: {
      // ... derived from LLM analysis
    },
  };
}
```

## Test Scenarios

### Unit Tests

1. **Name Stripping**: Verify names are replaced with anonymous identifiers
2. **Date Masking**: Verify dates are reduced to year-only
3. **Place Stripping**: Verify all location data is removed
4. **Structure Preservation**: Verify relationships remain intact
5. **Metadata Preservation**: Verify aggregate statistics are unchanged

### Integration Tests

1. **End-to-End Anonymization**: Full data structure through anonymization
2. **LLM Compatibility**: Verify anonymized data works with LLM APIs
3. **Performance**: Ensure anonymization doesn't impact transformer performance
4. **Memory Safety**: Verify no PII leaks in memory or logs

### Validation Tests

1. **PII Detection**: Verify no PII remains in anonymized output
2. **Statistical Integrity**: Verify aggregate patterns are preserved
3. **Structural Integrity**: Verify family relationships are maintained
4. **Transformer Compatibility**: Verify transformers can work with anonymized data

## Security Considerations

1. **No PII Logging**: Ensure anonymized data is never logged with PII
2. **Memory Cleanup**: Clear any temporary PII data from memory
3. **API Security**: Use secure channels for LLM API calls
4. **Data Retention**: Don't store anonymized data longer than necessary
5. **Audit Trail**: Log anonymization operations (without PII)

## Future Enhancements

1. **Configurable Anonymization**: Allow different anonymization levels
2. **Differential Privacy**: Add noise to statistical data
3. **Custom Anonymization**: Allow transformers to define custom rules
4. **Anonymization Validation**: Automated PII detection in output
5. **Performance Optimization**: Caching and lazy anonymization

## Success Criteria

1. **Zero PII Leakage**: No personal data in LLM transmissions
2. **Functional Preservation**: LLMs can still understand data structure
3. **Performance Impact**: <10ms overhead for typical datasets
4. **Transformer Compatibility**: All existing transformers work unchanged
5. **Test Coverage**: >95% test coverage for anonymization functions
