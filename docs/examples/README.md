# Examples

## Basic Usage

### Parse GEDCOM File

```bash
pnpm build:gedcom examples/kennedy/kennedy.ged
```

### Load Data in React

```typescript
import { useGedcomData } from '../hooks/useGedcomData';

function App() {
  const { data, loading, error } = useGedcomData({
    jsonFile: 'generated/parsed/kennedy-augmented.json'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <ArtGenerator familyData={data} />;
}
```

### Export High-Resolution Image

```typescript
import { exportPrintCanvas } from '../services/ExportService';

await exportPrintCanvas(familyData, {
  format: 'png',
  quality: 100,
  filename: 'family-tree-print',
  showNames: true,
  nodeSize: 24,
});
```

## Advanced Usage

### Custom Metadata Extraction

```typescript
import { extractIndividualMetadata } from '../metadata/transformation-pipeline';

const metadata = extractIndividualMetadata(individual, {
  allIndividuals: individuals,
  allFamilies: families,
});
```

### Custom Canvas Sketch

```typescript
import { createWebSketch } from '../display/FamilyTreeSketch';

const sketch = createWebSketch(familyData, 800, 600);
const p5Instance = new p5(sketch, containerRef.current);
```
