# Using gedcom-js for MVP

## Basic Usage Example

```typescript
import { Gedcom } from 'gedcom-js';

// Basic file parsing
async function parseGedcomFile(file: File): Promise<Gedcom> {
  const text = await file.text();
  const gedcom = new Gedcom();
  await gedcom.parse(text);
  return gedcom;
}

// Example of accessing data
function processGedcomData(gedcom: Gedcom) {
  // Get all individuals
  const individuals = gedcom.getIndividualRecords();

  // Get all families
  const families = gedcom.getFamilyRecords();

  // Example of accessing specific data
  individuals.forEach((individual) => {
    const name = individual.getName();
    const birth = individual.getBirth();
    const death = individual.getDeath();

    // Add our derived properties
    const enhancedData = {
      ...individual,
      // Example derived properties
      generationDepth: calculateGenerationDepth(individual, families),
      relationshipCount: countRelationships(individual, families),
      // Add more derived properties as needed
    };
  });
}

// Example of data enhancement
function calculateGenerationDepth(individual: any, families: any[]): number {
  // Implementation of generation depth calculation
  // This would be part of our data enhancement system
  return 0; // Placeholder
}

function countRelationships(individual: any, families: any[]): number {
  // Implementation of relationship counting
  // This would be part of our data enhancement system
  return 0; // Placeholder
}
```

## TypeScript Interface Example

```typescript
// types/gedcom.ts
export interface EnhancedIndividual {
  // Original GEDCOM data
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

  // Our enhanced properties
  generationDepth: number;
  relationshipCount: number;
  // Add more enhanced properties as needed
}

export interface EnhancedFamily {
  // Original GEDCOM data
  id: string;
  husband?: string;
  wife?: string;
  children: string[];

  // Our enhanced properties
  generation: number;
  size: number;
  // Add more enhanced properties as needed
}
```

## Advantages for MVP

1. **Simple Integration**

   - No need for CommonJS conversion
   - Direct ESM support
   - Minimal setup required

2. **Sufficient Features**

   - Basic parsing works well
   - TypeScript support is adequate
   - Error handling is basic but sufficient

3. **Easy to Replace**
   - If we need more features later, we can switch to gedcom-parse
   - The interface is simple enough to abstract behind our own wrapper
   - Minimal investment in the initial implementation

## Potential Limitations

1. **Basic Error Handling**

   - We might need to add our own validation
   - Error messages might not be as detailed

2. **No AST**

   - Less flexible for complex transformations
   - Might need to work with the data structure as-is

3. **No Streaming**
   - Could be an issue with very large files
   - But sufficient for MVP and initial development

## Next Steps

1. Create a simple wrapper around gedcom-js
2. Implement basic TypeScript interfaces
3. Add our data enhancement functions
4. Test with sample GEDCOM files
5. Monitor performance and error handling

If we need more advanced features later, we can:

1. Switch to gedcom-parse
2. Add our own streaming implementation
3. Enhance error handling
4. Add more sophisticated validation
