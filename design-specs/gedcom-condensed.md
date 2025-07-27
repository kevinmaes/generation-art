# GEDCOM 5.5.1 Condensed Reference

## Overview

GEDCOM (GEnealogical Data Communication) - Standard format for exchanging genealogical data between software systems.

## Core Concepts

### Data Representation Grammar

- **Level**: Hierarchical structure (0, 1, 2, 3...)
- **Tag**: 3-4 character identifier (e.g., NAME, BIRT, DEAT)
- **Value**: Data content
- **XREF**: Cross-reference pointer (@I1@, @F1@)
- **Line Format**: `LEVEL TAG [VALUE]`

### Lineage-Linked Form

Primary structure for family tree data exchange.

## Record Types

### Individual Record (INDI)

```
0 @I1@ INDI
1 NAME John /Doe/
1 SEX M
1 BIRT
2 DATE 15 JAN 1990
2 PLAC New York, NY, USA
1 DEAT
2 DATE 20 MAR 2020
2 PLAC Los Angeles, CA, USA
1 FAMC @F1@
1 FAMS @F2@
```

### Family Record (FAM)

```
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
1 MARR
2 DATE 15 JUN 2015
2 PLAC Las Vegas, NV, USA
```

### Source Record (SOUR)

```
0 @S1@ SOUR
1 TITL Birth Certificate
1 AUTH Vital Records Office
1 PUBL New York State
1 REPO @R1@
```

### Note Record (NOTE)

```
0 @N1@ NOTE
1 CONT This is a note about the individual
1 CONT that can span multiple lines.
```

### Repository Record (REPO)

```
0 @R1@ REPO
1 NAME Family History Library
1 ADDR 35 North West Temple
2 CONT Salt Lake City, UT 84150
2 CONT USA
```

## Tag Definitions

### Individual Tags

| Tag  | Description            | Level | Example                    |
| ---- | ---------------------- | ----- | -------------------------- |
| NAME | Individual name        | 1     | `1 NAME John /Doe/`        |
| SEX  | Gender (M/F/U)         | 1     | `1 SEX M`                  |
| BIRT | Birth event            | 1     | `1 BIRT`                   |
| DEAT | Death event            | 1     | `1 DEAT`                   |
| BURI | Burial event           | 1     | `1 BURI`                   |
| CHR  | Christening            | 1     | `1 CHR`                    |
| BAPM | Baptism                | 1     | `1 BAPM`                   |
| MARR | Marriage event         | 1     | `1 MARR`                   |
| DIV  | Divorce event          | 1     | `1 DIV`                    |
| RESI | Residence              | 1     | `1 RESI`                   |
| OCCU | Occupation             | 1     | `1 OCCU Engineer`          |
| EDUC | Education              | 1     | `1 EDUC Bachelor's Degree` |
| RELI | Religion               | 1     | `1 RELI Catholic`          |
| NATI | Nationality            | 1     | `1 NATI American`          |
| TITL | Title                  | 1     | `1 TITL Dr.`               |
| SSN  | Social Security Number | 1     | `1 SSN 123-45-6789`        |
| REFN | Reference number       | 1     | `1 REFN 12345`             |
| RIN  | Automated record ID    | 1     | `1 RIN 67890`              |
| FAMC | Family as child        | 1     | `1 FAMC @F1@`              |
| FAMS | Family as spouse       | 1     | `1 FAMS @F2@`              |

### Event Detail Tags

| Tag  | Description    | Level | Example                    |
| ---- | -------------- | ----- | -------------------------- |
| DATE | Event date     | 2     | `2 DATE 15 JAN 1990`       |
| PLAC | Event place    | 2     | `2 PLAC New York, NY, USA` |
| TYPE | Event type     | 2     | `2 TYPE Civil`             |
| CAUS | Cause of death | 2     | `2 CAUS Heart Attack`      |
| AGE  | Age at event   | 2     | `2 AGE 75`                 |

### Family Tags

| Tag  | Description        | Level | Example       |
| ---- | ------------------ | ----- | ------------- |
| HUSB | Husband reference  | 1     | `1 HUSB @I1@` |
| WIFE | Wife reference     | 1     | `1 WIFE @I2@` |
| CHIL | Child reference    | 1     | `1 CHIL @I3@` |
| NCHI | Number of children | 1     | `1 NCHI 3`    |

### Address Structure

```
1 ADDR 123 Main Street
2 CONT Apartment 4B
2 ADR1 123 Main Street
2 ADR2 Apartment 4B
2 CITY New York
2 STAE NY
2 POST 10001
2 CTRY USA
1 PHON (555) 123-4567
1 EMAIL john.doe@email.com
1 FAX (555) 123-4568
1 WWW http://www.johndoe.com
```

### Source Citation Tags

| Tag  | Description      | Level | Example                  |
| ---- | ---------------- | ----- | ------------------------ |
| SOUR | Source reference | 1     | `1 SOUR @S1@`            |
| PAGE | Page number      | 2     | `2 PAGE 45`              |
| QUAY | Quality of data  | 2     | `2 QUAY 3`               |
| NOTE | Source note      | 2     | `2 NOTE Additional info` |

### Multimedia Tags

| Tag  | Description       | Level | Example                |
| ---- | ----------------- | ----- | ---------------------- |
| OBJE | Multimedia object | 1     | `1 OBJE @M1@`          |
| FILE | File reference    | 2     | `2 FILE photo.jpg`     |
| FORM | File format       | 2     | `2 FORM jpg`           |
| TITL | Title             | 2     | `2 TITL Wedding Photo` |

## Data Types

### Date Formats

- **Exact**: `15 JAN 1990`
- **Approximate**: `ABT 1990`
- **Before**: `BEF 1990`
- **After**: `AFT 1990`
- **Between**: `BET 1985 AND 1995`
- **Estimated**: `EST 1990`
- **Calculated**: `CAL 1990`
- **From/To**: `FROM 1985 TO 1995`

### Place Formats

- **Standard**: `City, State, Country`
- **Hierarchical**: `City/State/Country`
- **With coordinates**: `City, State, Country (lat,long)`

### Name Formats

- **Standard**: `Given /Surname/`
- **With titles**: `Dr. John /Doe/ Jr.`
- **Multiple surnames**: `Given /Surname1/ /Surname2/`

## Character Sets

- **ASCII**: Basic English characters
- **ANSI**: Extended ASCII with diacritics
- **UTF-8**: Unicode support
- **UNICODE**: Full Unicode support

## File Structure

```
0 HEAD
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
1 CHAR UTF-8
1 SOUR MySoftware
1 DATE 15 JAN 2024
1 SUBM @SUBM1@
0 @SUBM1@ SUBM
1 NAME John Doe
1 ADDR 123 Main St
2 CONT New York, NY 10001
0 @I1@ INDI
1 NAME John /Doe/
1 SEX M
1 BIRT
2 DATE 15 JAN 1990
2 PLAC New York, NY, USA
1 FAMC @F1@
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 TRLR
```

## Validation Rules

- All records must have unique XREF IDs
- Required tags must be present
- Tag hierarchy must be correct
- Date formats must be valid
- Place names should be consistent

## Best Practices

- Use consistent date formats
- Standardize place names
- Include source citations
- Validate data before export
- Use appropriate character encoding
- Include submitter information
- Add notes for clarification

## Common Extensions

- **Custom tags**: Start with underscore `_CUSTOM`
- **User-defined**: `_UDF` prefix
- **Software-specific**: Vendor prefixes

## Error Handling

- **Unknown tags**: Preserve but flag
- **Invalid dates**: Mark as estimated
- **Missing required**: Use default values
- **Malformed structure**: Attempt recovery

## Performance Considerations

- **Large files**: Process in chunks
- **Memory usage**: Stream processing
- **Validation**: Incremental checking
- **Indexing**: Build lookup tables

## Integration Guidelines

- **Import**: Validate before processing
- **Export**: Follow standard format
- **Conversion**: Preserve data integrity
- **Mapping**: Document custom fields
