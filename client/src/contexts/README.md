# FamilyDataContext

The `FamilyDataContext` provides a centralized way to share family data across components, eliminating duplicate network requests and ensuring consistent loading/error states.

## Features

- **Single data source**: Only one fetch occurs per `jsonFile`
- **Synchronized states**: All components render in sync for loading/error/success
- **Status discriminated union**: Uses `'idle' | 'loading' | 'success' | 'error'` instead of separate boolean flags
- **No prop drilling**: Components can access data directly through context

## Usage

### Basic Usage

```tsx
import { FamilyDataProvider, useFamilyData } from '../contexts/FamilyDataContext';

// Wrap your components with the provider
function App() {
  return (
    <FamilyDataProvider jsonFile="/data/family.json">
      <MyComponents />
    </FamilyDataProvider>
  );
}

// Use the hook in any child component
function MyComponent() {
  const { status, data, error, refetch } = useFamilyData();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'error') return <div>Error: {error}</div>;
  if (status === 'success') return <div>Data loaded: {data.individuals.length} individuals</div>;
  
  return <div>No data</div>;
}
```

### Keyed Provider

For scenarios where you need to switch between different JSON files:

```tsx
import { createKeyedFamilyDataProvider } from '../contexts/FamilyDataContext';

function App() {
  const [jsonFile, setJsonFile] = useState('/data/family1.json');
  
  return createKeyedFamilyDataProvider({
    jsonFile,
    children: <MyComponents />,
    onDataLoaded: (data) => console.log('Data loaded:', data),
    onError: (error) => console.error('Error:', error),
  });
}
```

### Migration from useGedcomData

**Before (with duplicate fetching):**
```tsx
// FramedArtwork.tsx
function FramedArtwork({ jsonFile }) {
  const { data } = useGedcomData({ jsonFile });
  // ...
}

// ArtGenerator.tsx  
function ArtGenerator({ jsonFile }) {
  const { data } = useGedcomData({ jsonFile }); // Duplicate request!
  // ...
}
```

**After (with context):**
```tsx
// App.tsx
function App() {
  return (
    <FamilyDataProvider jsonFile={jsonFile}>
      <FramedArtwork />
      <ArtGenerator />
    </FamilyDataProvider>
  );
}

// FramedArtwork.tsx
function FramedArtwork() {
  const { data } = useFamilyData(); // No duplicate request
  // ...
}

// ArtGenerator.tsx
function ArtGenerator() {
  const { data } = useFamilyData(); // Shares the same data
  // ...
}
```

## API Reference

### FamilyDataProvider Props

- `jsonFile: string` - Path to the JSON file to load
- `children: ReactNode` - Child components
- `onDataLoaded?: (data) => void` - Callback when data loads successfully
- `onError?: (error) => void` - Callback when an error occurs

### useFamilyData Return Value

- `status: 'idle' | 'loading' | 'success' | 'error'` - Current loading status
- `data: GedcomDataWithMetadata | null` - The loaded family data
- `error: string | null` - Error message if loading failed
- `refetch: () => void` - Function to retry loading

## Benefits

1. **Performance**: Eliminates duplicate network requests
2. **Consistency**: All components stay in sync
3. **Simplicity**: No need to pass data through props
4. **Type Safety**: Full TypeScript support with discriminated unions
5. **Error Handling**: Centralized error states