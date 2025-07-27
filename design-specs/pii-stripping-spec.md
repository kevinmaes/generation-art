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

### High PII Fields (Strip Completely)

| Data Field                  | GEDCOM Tag  | Action           | Rationale                       |
| --------------------------- | ----------- | ---------------- | ------------------------------- |
| **Individual Names**        | `NAME`      | Strip completely | Direct personal identification  |
| **Exact Addresses**         | `ADDR`      | Strip completely | Direct location identification  |
| **Street Addresses**        | `RESI.ADDR` | Strip completely | Direct location identification  |
| **Social Security Numbers** | `SSN`       | Strip completely | Government ID, highly sensitive |
| **Phone Numbers**           | `PHON`      | Strip completely | Direct contact information      |
| **Email Addresses**         | `EMAIL`     | Strip completely | Direct contact information      |
| **Web URLs**                | `WWW`       | Strip completely | Direct contact information      |
| **Specific Birth Dates**    | `BIRT.DATE` | Strip completely | Temporal identification         |
| **Specific Death Dates**    | `DEAT.DATE` | Strip completely | Temporal identification         |
| **Specific Marriage Dates** | `MARR.DATE` | Strip completely | Temporal identification         |
| **Exact Birth Places**      | `BIRT.PLAC` | Strip completely | Geographic identification       |
| **Exact Death Places**      | `DEAT.PLAC` | Strip completely | Geographic identification       |
| **Exact Marriage Places**   | `MARR.PLAC` | Strip completely | Geographic identification       |
| **Personal Notes**          | `NOTE`      | Strip completely | May contain personal details    |
| **Source Citations**        | `SOUR`      | Strip completely | May contain personal details    |

### Medium PII Fields (Mask/Transform)

| Data Field                 | GEDCOM Tag                | Action                  | Rationale                          |
| -------------------------- | ------------------------- | ----------------------- | ---------------------------------- |
| **Birth Year Only**        | `BIRT.DATE`               | Extract year only       | Temporal pattern, not specific     |
| **Death Year Only**        | `DEAT.DATE`               | Extract year only       | Temporal pattern, not specific     |
| **Marriage Year Only**     | `MARR.DATE`               | Extract year only       | Temporal pattern, not specific     |
| **Birth Country/State**    | `BIRT.PLAC`               | Reduce to country/state | Geographic pattern, not specific   |
| **Death Country/State**    | `DEAT.PLAC`               | Reduce to country/state | Geographic pattern, not specific   |
| **Marriage Country/State** | `MARR.PLAC`               | Reduce to country/state | Geographic pattern, not specific   |
| **Lifespan Values**        | `BIRT.DATE` + `DEAT.DATE` | Normalize to 0-1 range  | Statistical pattern, not absolute  |
| **Age at Death**           | `BIRT.DATE` + `DEAT.DATE` | Normalize to 0-1 range  | Statistical pattern, not absolute  |
| **Age at Marriage**        | `BIRT.DATE` + `MARR.DATE` | Normalize to 0-1 range  | Statistical pattern, not absolute  |
| **Occupation**             | `OCCU`                    | Generalize category     | Professional pattern, not specific |
| **Education Level**        | `EDUC`                    | Generalize level        | Educational pattern, not specific  |
| **Religion**               | `RELI`                    | Generalize category     | Cultural pattern, not specific     |
| **Nationality**            | `NATI`                    | Generalize region       | Cultural pattern, not specific     |
| **Titles**                 | `TITL`                    | Generalize type         | Social pattern, not specific       |

### Low PII Fields (Keep As-Is)

| Data Field                 | GEDCOM Tag  | Action                    | Rationale                            |
| -------------------------- | ----------- | ------------------------- | ------------------------------------ |
| **Gender**                 | `SEX`       | Keep as-is                | Statistical pattern, not identifying |
| **Family Relationships**   | `FAMC/FAMS` | Keep structure, strip IDs | Relationship patterns important      |
| **Generation Numbers**     | Computed    | Keep as-is                | Structural metadata                  |
| **Zodiac Signs**           | `BIRT.DATE` | Keep as-is                | Statistical pattern                  |
| **Birth Months**           | `BIRT.DATE` | Keep as-is                | Seasonal patterns important          |
| **Birth Days of Week**     | `BIRT.DATE` | Keep as-is                | Statistical pattern                  |
| **Is Alive Status**        | `DEAT`      | Keep as-is                | Statistical pattern                  |
| **Number of Children**     | `CHIL`      | Keep as-is                | Family structure pattern             |
| **Number of Siblings**     | Computed    | Keep as-is                | Family structure pattern             |
| **Number of Spouses**      | `FAMS`      | Keep as-is                | Family structure pattern             |
| **Metadata Statistics**    | Computed    | Keep as-is                | Aggregate data, not individual       |
| **Graph Structure**        | Computed    | Keep as-is                | Structural metadata                  |
| **Geographic Aggregates**  | Computed    | Keep as-is                | Aggregate patterns                   |
| **Temporal Aggregates**    | Computed    | Keep as-is                | Aggregate patterns                   |
| **Demographic Aggregates** | Computed    | Keep as-is                | Aggregate patterns                   |

## Detailed Field Specifications

### Individual Data

#### High PII Fields (Strip Completely)

- `name`: Replace with `"Individual_<ID>"` or `"Person_<generation>_<index>"`
- `birth.date`: Strip completely (specific dates)
- `death.date`: Strip completely (specific dates)
- `birth.place`: Strip completely (exact locations)
- `death.place`: Strip completely (exact locations)
- `address`: Strip completely (exact addresses)
- `phone`: Strip completely (contact information)
- `email`: Strip completely (contact information)
- `www`: Strip completely (contact information)
- `ssn`: Strip completely (government ID)
- `note`: Strip completely (personal notes)
- `source`: Strip completely (source citations)

#### Medium PII Fields (Mask/Transform)

- `birth.date`: Extract only year → `{ year: 1980 }`
- `death.date`: Extract only year → `{ year: 2020 }`
- `birth.place`: Reduce to country/state → `"USA, NY"` or `"Canada, ON"`
- `death.place`: Reduce to country/state → `"USA, CA"` or `"Canada, BC"`
- `lifespan`: Normalize to 0-1 range, remove absolute values
- `ageAtDeath`: Normalize to 0-1 range, remove absolute values
- `ageAtMarriage`: Normalize to 0-1 range, remove absolute values
- `occupation`: Generalize to category → `"Professional"`, `"Service"`, `"Manual Labor"`
- `education`: Generalize to level → `"Primary"`, `"Secondary"`, `"Higher"`
- `religion`: Generalize to category → `"Christian"`, `"Jewish"`, `"Muslim"`, `"Other"`
- `nationality`: Generalize to region → `"North American"`, `"European"`, `"Asian"`
- `title`: Generalize to type → `"Military"`, `"Academic"`, `"Religious"`, `"Noble"`

#### Low PII Fields (Keep As-Is)

- `gender`: Keep `'M' | 'F' | 'U'`
- `generation`: Keep numeric value
- `relativeGenerationValue`: Keep 0-1 normalized value
- `birthMonth`: Keep 1-12 value
- `birthDayOfWeek`: Keep 0-6 value (Sunday = 0)
- `zodiacSign`: Keep string value
- `isAlive`: Keep boolean value
- `numberOfChildren`: Keep numeric value
- `numberOfSiblings`: Keep numeric value
- `numberOfSpouses`: Keep numeric value
- `centrality`: Keep numeric value
- `relationshipCount`: Keep numeric value
- `ancestorCount`: Keep numeric value
- `descendantCount`: Keep numeric value
- `siblingCount`: Keep numeric value
- `cousinCount`: Keep numeric value

### Family Data

#### High PII Fields (Strip Completely)

- Family-specific names or identifiers
- Marriage dates (if specific)
- Marriage places (if specific)
- Family notes
- Family source citations

#### Medium PII Fields (Mask/Transform)

- Marriage dates: Extract only year
- Marriage places: Reduce to country/state
- Family size: Keep as numeric, strip individual details

#### Low PII Fields (Keep As-Is)

- Family structure (parent-child relationships)
- Sibling relationships
- Family metadata statistics
- `numberOfChildren`: Keep numeric value
- `familyComplexity`: Keep numeric value
- `blendedFamily`: Keep boolean value
- `remarriage`: Keep boolean value
- `generation`: Keep numeric value
- `sameCountryParents`: Keep boolean value
- `crossCountryMarriage`: Keep boolean value
- `marriageYear`: Keep numeric value (if already year-only)
- `averageChildAge`: Keep numeric value
- `childSpacing`: Keep array of numbers

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

## Geographic Data Handling Strategy

### Birth/Death Place Processing

1. **Full Place String**: `"123 Main St, New York, NY, USA"`
2. **Extract Components**: Parse into street, city, state, country
3. **Strip Street Level**: Remove `"123 Main St"`
4. **Keep City/State/Country**: `"New York, NY, USA"`
5. **Optionally Reduce Further**: `"NY, USA"` or just `"USA"`

### Implementation Logic

```typescript
function processPlace(
  place: string,
  level: 'country' | 'state' | 'city',
): string {
  // Parse place string into components
  const components = parsePlaceString(place);

  switch (level) {
    case 'country':
      return components.country || 'Unknown';
    case 'state':
      return components.state && components.country
        ? `${components.state}, ${components.country}`
        : components.country || 'Unknown';
    case 'city':
      return components.city && components.state && components.country
        ? `${components.city}, ${components.state}, ${components.country}`
        : components.state && components.country
          ? `${components.state}, ${components.country}`
          : components.country || 'Unknown';
  }
}
```

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
