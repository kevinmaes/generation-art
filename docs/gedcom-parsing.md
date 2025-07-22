# GEDCOM Parsing

## Parser Comparison

| Parser                          | Pros                          | Cons                     | Use Case                     |
| ------------------------------- | ----------------------------- | ------------------------ | ---------------------------- |
| **SimpleGedcomParser** (Custom) | Lightweight, focused, no deps | Basic GEDCOM 5.5 support | ✅ **Current choice**        |
| gedcom-ts                       | Full GEDCOM 5.5, well-tested  | Heavy, complex API       | Large files, full compliance |
| gedcom-parse                    | Simple API                    | Limited features         | Basic parsing only           |

## Implementation

### Current: SimpleGedcomParser

**Location**: `src/cli/parsers/SimpleGedcomParser.ts`

```typescript
// Key features
- Basic GEDCOM 5.5 parsing
- Individual & Family extraction
- Name, date, relationship handling
- Cross-reference support (@XREF@)
```

**Usage**:

```bash
pnpm build:gedcom examples/kennedy/kennedy.ged
```

### Parser Facade

**Location**: `src/cli/facades/GedcomParserFacade.ts`

```typescript
// Abstracts parser selection
interface GedcomParserFacade {
  parse(gedcomText: string): GedcomData;
  validate(data: GedcomData): boolean;
}
```

## GEDCOM Structure

### Supported Tags

| Tag    | Level | Description       | Example              |
| ------ | ----- | ----------------- | -------------------- |
| `INDI` | 0     | Individual record | `0 @I1@ INDI`        |
| `FAM`  | 0     | Family record     | `0 @F1@ FAM`         |
| `NAME` | 1     | Individual name   | `1 NAME John /Doe/`  |
| `BIRT` | 1     | Birth event       | `1 BIRT`             |
| `DEAT` | 1     | Death event       | `1 DEAT`             |
| `MARR` | 1     | Marriage event    | `1 MARR`             |
| `DATE` | 2     | Event date        | `2 DATE 15 JAN 1990` |
| `HUSB` | 1     | Husband reference | `1 HUSB @I1@`        |
| `WIFE` | 1     | Wife reference    | `1 WIFE @I2@`        |
| `CHIL` | 1     | Child reference   | `1 CHIL @I3@`        |

### Data Flow

```mermaid
graph LR
    A[GEDCOM Text] --> B[Parse Lines]
    B --> C[Extract XREFs]
    C --> D[Build Objects]
    D --> E[Link Relationships]
    E --> F[Output JSON]

    style A fill:#e3f2fd
    style F fill:#e8f5e8
```

## Error Handling

```typescript
// Common issues
- Malformed GEDCOM syntax
- Missing cross-references
- Invalid date formats
- Circular relationships
```

**Strategy**: Graceful degradation + detailed logging

## Performance

- **Small files** (<1MB): Parse in memory
- **Large files** (>1MB): Stream processing (planned)
- **Memory usage**: ~2x file size for parsed data

## Future Enhancements

- [ ] Full GEDCOM 5.5 compliance
- [ ] Source and note support
- [ ] Media file handling
- [ ] Validation against spec
