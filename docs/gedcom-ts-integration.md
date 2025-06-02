# GEDCOM-TS Integration Guide

## Overview

This guide provides detailed instructions for integrating `gedcom-ts` into our generative art project. `gedcom-ts` is a TypeScript-first GEDCOM parser that provides AST-based parsing and type safety.

## Installation

```bash
npm install gedcom-ts
```

## Basic Usage

### 1. Simple File Parsing

```typescript
import { GedcomParser } from 'gedcom-ts';

async function parseGedcomFile(filePath: string) {
  const parser = new GedcomParser();
  const result = await parser.parseFile(filePath);

  // Access individuals
  result.individuals.forEach((individual) => {
    console.log(`Name: ${individual.name}`);
    console.log(`Birth: ${individual.birth?.date}`);
    console.log(`Death: ${individual.death?.date}`);
  });

  // Access families
  result.families.forEach((family) => {
    console.log(`Husband: ${family.husband?.name}`);
    console.log(`Wife: ${family.wife?.name}`);
    console.log(`Children: ${family.children.length}`);
  });
}
```

### 2. Type Definitions

```typescript
// Custom types for enhanced data structure
interface EnhancedIndividual {
  id: string;
  name: string;
  birth?: {
    date?: string;
    place?: string;
  };
  death?: {
    date?: string;
    place?: string;
  };
  families: {
    asSpouse: string[];
    asChild: string[];
  };
  notes: string[];
}

interface EnhancedFamily {
  id: string;
  husband?: EnhancedIndividual;
  wife?: EnhancedIndividual;
  children: EnhancedIndividual[];
  marriage?: {
    date?: string;
    place?: string;
  };
}
```

### 3. Data Transformation

```typescript
import { GedcomParser, Individual, Family } from 'gedcom-ts';

class GedcomTransformer {
  private individuals: Map<string, EnhancedIndividual> = new Map();
  private families: Map<string, EnhancedFamily> = new Map();

  transform(parser: GedcomParser) {
    // Transform individuals
    parser.individuals.forEach((individual) => {
      this.individuals.set(individual.id, this.transformIndividual(individual));
    });

    // Transform families
    parser.families.forEach((family) => {
      this.families.set(family.id, this.transformFamily(family));
    });

    return {
      individuals: Array.from(this.individuals.values()),
      families: Array.from(this.families.values()),
    };
  }

  private transformIndividual(ind: Individual): EnhancedIndividual {
    return {
      id: ind.id,
      name: ind.name,
      birth: {
        date: ind.birth?.date,
        place: ind.birth?.place,
      },
      death: {
        date: ind.death?.date,
        place: ind.death?.place,
      },
      families: {
        asSpouse: ind.familiesAsSpouse.map((f) => f.id),
        asChild: ind.familiesAsChild.map((f) => f.id),
      },
      notes: ind.notes,
    };
  }

  private transformFamily(fam: Family): EnhancedFamily {
    return {
      id: fam.id,
      husband: fam.husband ? this.individuals.get(fam.husband.id) : undefined,
      wife: fam.wife ? this.individuals.get(fam.wife.id) : undefined,
      children: fam.children.map((child) => this.individuals.get(child.id)!),
      marriage: {
        date: fam.marriage?.date,
        place: fam.marriage?.place,
      },
    };
  }
}
```

## Error Handling

```typescript
import { GedcomParser, GedcomError } from 'gedcom-ts';

async function parseWithErrorHandling(filePath: string) {
  const parser = new GedcomParser();

  try {
    const result = await parser.parseFile(filePath);
    return result;
  } catch (error) {
    if (error instanceof GedcomError) {
      console.error('GEDCOM parsing error:', {
        line: error.line,
        message: error.message,
        code: error.code,
      });
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

## Performance Considerations

1. **Memory Usage**

   - The parser loads the entire file into memory
   - Consider file size limitations
   - Monitor memory usage with large files

2. **Processing Large Files**
   - Process data in chunks
   - Use async/await for non-blocking operations
   - Implement progress tracking

```typescript
async function processLargeFile(filePath: string) {
  const parser = new GedcomParser();
  const transformer = new GedcomTransformer();

  // Track progress
  let processed = 0;
  const total = await getFileLineCount(filePath);

  parser.on('progress', (progress) => {
    processed = progress;
    console.log(`Processing: ${((processed / total) * 100).toFixed(2)}%`);
  });

  const result = await parser.parseFile(filePath);
  return transformer.transform(result);
}
```

## Best Practices

1. **Type Safety**

   - Always use TypeScript interfaces
   - Enable strict mode
   - Use type guards for optional fields

2. **Error Handling**

   - Implement comprehensive error handling
   - Log errors with context
   - Provide user-friendly error messages

3. **Data Validation**

   - Validate input data
   - Check for required fields
   - Handle missing or malformed data

4. **Performance**
   - Monitor memory usage
   - Implement progress tracking
   - Use async operations

## Integration Steps

1. **Setup**

   ```bash
   npm install gedcom-ts
   ```

2. **Configuration**

   ```typescript
   // config/gedcom.ts
   export const gedcomConfig = {
     maxFileSize: 10 * 1024 * 1024, // 10MB
     supportedVersions: ['5.5.1'],
     encoding: 'UTF-8',
   };
   ```

3. **Service Layer**

   ```typescript
   // services/gedcom.service.ts
   import { GedcomParser } from 'gedcom-ts';
   import { gedcomConfig } from '../config/gedcom';

   export class GedcomService {
     private parser: GedcomParser;

     constructor() {
       this.parser = new GedcomParser();
     }

     async parseFile(filePath: string) {
       // Implementation
     }

     async validateFile(filePath: string) {
       // Implementation
     }
   }
   ```

4. **API Integration**

   ```typescript
   // api/gedcom.controller.ts
   import { GedcomService } from '../services/gedcom.service';

   export class GedcomController {
     constructor(private gedcomService: GedcomService) {}

     async uploadFile(req: Request, res: Response) {
       // Implementation
     }
   }
   ```

## Testing

```typescript
// tests/gedcom.test.ts
import { GedcomParser } from 'gedcom-ts';

describe('GedcomParser', () => {
  let parser: GedcomParser;

  beforeEach(() => {
    parser = new GedcomParser();
  });

  it('should parse valid GEDCOM file', async () => {
    const result = await parser.parseFile('test/fixtures/valid.ged');
    expect(result.individuals).toBeDefined();
    expect(result.families).toBeDefined();
  });

  it('should handle invalid GEDCOM file', async () => {
    await expect(
      parser.parseFile('test/fixtures/invalid.ged'),
    ).rejects.toThrow();
  });
});
```

## Next Steps

1. Implement the service layer
2. Add file validation
3. Create API endpoints
4. Add error handling
5. Implement progress tracking
6. Add performance monitoring
7. Create comprehensive tests

## Resources

- [GEDCOM-TS GitHub Repository](https://github.com/bertrandjnt/gedcom-ts)
- [GEDCOM 5.5.1 Specification](https://www.gedcom.org/gedcom.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
