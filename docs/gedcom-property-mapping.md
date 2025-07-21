# GEDCOM Property Mapping Reference

## Overview

This document provides a comprehensive mapping between our TypeScript data structures and the GEDCOM 5.5.1 specification properties. This mapping shows the direct 1-1 relationships between our application's data model and the underlying GEDCOM format.

## Individual Properties

### Core Individual Fields

| TypeScript Property | GEDCOM Tag  | GEDCOM Structure                      | Description                  |
| ------------------- | ----------- | ------------------------------------- | ---------------------------- |
| `id`                | `@XREF@`    | `0 @I123@ INDI`                       | Unique individual identifier |
| `name`              | `NAME`      | `1 NAME John /Smith/`                 | Full name of the individual  |
| `birth.date`        | `BIRT.DATE` | `1 BIRT`<br/>`2 DATE 15 JUN 1990`     | Birth date                   |
| `birth.place`       | `BIRT.PLAC` | `1 BIRT`<br/>`2 PLAC New York, NY`    | Birth place                  |
| `death.date`        | `DEAT.DATE` | `1 DEAT`<br/>`2 DATE 15 JUN 2020`     | Death date                   |
| `death.place`       | `DEAT.PLAC` | `1 DEAT`<br/>`2 PLAC Los Angeles, CA` | Death place                  |

### Relationship Fields

| TypeScript Property | GEDCOM Tag      | GEDCOM Structure   | Description                 |
| ------------------- | --------------- | ------------------ | --------------------------- |
| `parents`           | `FAMC`          | `1 FAMC @F1@`      | Family as Child references  |
| `spouses`           | `FAMS`          | `1 FAMS @F2@`      | Family as Spouse references |
| `children`          | `CHIL` (in FAM) | `1 CHIL @I456@`    | Children from FAM records   |
| `siblings`          | Derived         | From FAMC siblings | Computed from shared FAMC   |

## Family Properties

### Core Family Fields

| TypeScript Property | GEDCOM Tag | GEDCOM Structure | Description              |
| ------------------- | ---------- | ---------------- | ------------------------ |
| `id`                | `@XREF@`   | `0 @F1@ FAM`     | Unique family identifier |
| `husband`           | `HUSB`     | `1 HUSB @I123@`  | Husband reference        |
| `wife`              | `WIFE`     | `1 WIFE @I456@`  | Wife reference           |
| `children`          | `CHIL`     | `1 CHIL @I789@`  | Children references      |

## Computed Properties

### Augmented Individual Fields

| TypeScript Property       | GEDCOM Source    | Computation          | Description                |
| ------------------------- | ---------------- | -------------------- | -------------------------- |
| `generation`              | `FAMC` hierarchy | Tree traversal       | Generation depth from root |
| `relativeGenerationValue` | `FAMC` hierarchy | Position calculation | Relative position in tree  |

### Metadata Fields

| TypeScript Property | GEDCOM Source            | Computation              | Description                     |
| ------------------- | ------------------------ | ------------------------ | ------------------------------- |
| `lifespan`          | `BIRT.DATE`, `DEAT.DATE` | Date difference          | Years between birth and death   |
| `isAlive`           | `DEAT` tag               | Presence check           | True if no DEAT tag exists      |
| `birthMonth`        | `BIRT.DATE`              | Date parsing             | Month extracted from birth date |
| `zodiacSign`        | `BIRT.DATE`              | Astrological calculation | Zodiac sign from birth date     |

## GEDCOM Tag Reference

### Individual Record Tags

```gedcom
0 @I123@ INDI                    # Individual record start
1 NAME John /Smith/              # Individual name
1 SEX M                          # Gender
1 BIRT                           # Birth event
2 DATE 15 JUN 1990              # Birth date
2 PLAC New York, NY             # Birth place
1 DEAT                           # Death event
2 DATE 15 JUN 2020              # Death date
2 PLAC Los Angeles, CA          # Death place
1 FAMC @F1@                     # Family as child
1 FAMS @F2@                     # Family as spouse
```

### Family Record Tags

```gedcom
0 @F1@ FAM                       # Family record start
1 HUSB @I123@                   # Husband reference
1 WIFE @I456@                   # Wife reference
1 MARR                           # Marriage event
2 DATE 15 JUN 2015              # Marriage date
2 PLAC Las Vegas, NV            # Marriage place
1 CHIL @I789@                   # Child reference
1 CHIL @I790@                   # Another child reference
```

## Parser Implementation Mapping

### SimpleGedcomParser

| GEDCOM Tag | Parser Method        | Output Property         |
| ---------- | -------------------- | ----------------------- |
| `INDI`     | `handleIndividual()` | Creates new individual  |
| `NAME`     | `handleName()`       | Sets `name` property    |
| `BIRT`     | Sets `currentEvent`  | Prepares for date/place |
| `DEAT`     | Sets `currentEvent`  | Prepares for date/place |
| `DATE`     | `handleDate()`       | Sets birth/death date   |
| `HUSB`     | `handleHusband()`    | Links to family         |
| `WIFE`     | `handleWife()`       | Links to family         |
| `CHIL`     | `handleChild()`      | Links to family         |

### GedcomTsParserFacade

| GEDCOM Tag  | Parser Output        | TypeScript Property |
| ----------- | -------------------- | ------------------- |
| `@XREF@`    | `person.id`          | `id`                |
| `NAME`      | `person.name`        | `name`              |
| `BIRT.DATE` | `person.birth.date`  | `birth.date`        |
| `BIRT.PLAC` | `person.birth.place` | `birth.place`       |
| `DEAT.DATE` | `person.death.date`  | `death.date`        |
| `DEAT.PLAC` | `person.death.place` | `death.place`       |

## Data Transformation Pipeline

### Stage 1: Raw GEDCOM → Parsed Objects

```typescript
// Input: GEDCOM text
const gedcomText =
  '0 @I1@ INDI\n1 NAME John /Smith/\n1 BIRT\n2 DATE 15 JUN 1990';

// Output: Individual object
const individual: Individual = {
  id: 'I1', // From @I1@
  name: 'John Smith', // From NAME
  birth: { date: '15 JUN 1990' }, // From BIRT.DATE
  death: undefined, // No DEAT tag
  parents: [], // No FAMC tags
  spouses: [], // No FAMS tags
  children: [], // No CHIL tags in FAM
  siblings: [], // Computed from FAMC
};
```

### Stage 2: Parsed Objects → Augmented Objects

```typescript
// Input: Individual object
const individual: Individual = {
  /* ... */
};

// Output: Augmented individual
const augmented: AugmentedIndividual = {
  ...individual,
  generation: 2, // Computed from FAMC hierarchy
  relativeGenerationValue: 0.75, // Computed position
};
```

### Stage 3: Augmented Objects → Metadata Objects

```typescript
// Input: Augmented individual
const augmented: AugmentedIndividual = {
  /* ... */
};

// Output: Individual with metadata
const withMetadata: IndividualWithMetadata = {
  ...augmented,
  metadata: {
    lifespan: 30, // 2020 - 1990
    isAlive: false, // Has DEAT tag
    birthMonth: 6, // June
    zodiacSign: 'Gemini', // June 15
  },
};
```

## Validation Rules

### Required GEDCOM Tags

| Property     | Required | GEDCOM Tag  | Validation      |
| ------------ | -------- | ----------- | --------------- |
| `id`         | Yes      | `@XREF@`    | Must be unique  |
| `name`       | Yes      | `NAME`      | Must be present |
| `birth.date` | No       | `BIRT.DATE` | Optional        |
| `death.date` | No       | `DEAT.DATE` | Optional        |

### Data Type Validation

| GEDCOM Tag | Expected Format   | Validation       |
| ---------- | ----------------- | ---------------- |
| `DATE`     | `DD MMM YYYY`     | Date parsing     |
| `PLAC`     | String            | Place validation |
| `NAME`     | `Given /Surname/` | Name parsing     |
| `@XREF@`   | `@ID@`            | ID format        |

## Error Handling

### Common GEDCOM Parsing Errors

| Error Type         | GEDCOM Cause            | Handling           |
| ------------------ | ----------------------- | ------------------ |
| Missing XREF       | `0 INDI` (no ID)        | Generate unique ID |
| Invalid DATE       | `2 DATE invalid`        | Set to null        |
| Missing NAME       | `0 @I1@ INDI` (no NAME) | Use placeholder    |
| Circular Reference | FAMC/FAMS loop          | Detect and break   |

### Parser-Specific Issues

| Parser               | Issue                         | Solution             |
| -------------------- | ----------------------------- | -------------------- |
| SimpleGedcomParser   | Limited relationship tracking | Use FAMC/FAMS        |
| GedcomTsParserFacade | Type mismatches               | Type assertions      |
| Custom Parser        | Missing tags                  | Graceful degradation |

## Best Practices

### GEDCOM Compliance

1. **Follow GEDCOM 5.5.1 specification** for tag usage
2. **Validate XREF references** before processing
3. **Handle missing optional tags** gracefully
4. **Preserve original GEDCOM structure** when possible

### Data Integrity

1. **Validate date formats** before parsing
2. **Check for circular references** in relationships
3. **Ensure unique IDs** across individuals and families
4. **Maintain referential integrity** between records

### Performance Considerations

1. **Cache parsed GEDCOM data** to avoid re-parsing
2. **Use efficient data structures** for relationship lookups
3. **Batch process large files** to manage memory
4. **Validate data incrementally** during parsing

## Future Enhancements

### Additional GEDCOM Tags

| Tag    | Purpose     | Implementation Status |
| ------ | ----------- | --------------------- |
| `SEX`  | Gender      | Not implemented       |
| `OCCU` | Occupation  | Not implemented       |
| `EDUC` | Education   | Not implemented       |
| `RELI` | Religion    | Not implemented       |
| `NATI` | Nationality | Not implemented       |

### Extended Metadata

| Metadata            | GEDCOM Source            | Use Case                 |
| ------------------- | ------------------------ | ------------------------ |
| `ageAtMarriage`     | `BIRT.DATE`, `MARR.DATE` | Relationship analysis    |
| `migrationPath`     | `BIRT.PLAC`, `DEAT.PLAC` | Geographic visualization |
| `occupationCluster` | `OCCU`                   | Social analysis          |
| `educationLevel`    | `EDUC`                   | Demographic analysis     |

---

**Note**: This mapping is based on GEDCOM 5.5.1 specification and our current implementation. Additional GEDCOM tags may be supported in future versions.
