# XState v5 Architecture for Generation Art

## Overview

This document outlines a comprehensive XState v5 state machine architecture to manage the complex state requirements of the Generation Art application. The machine handles both data loading states and UI navigation states in a unified, predictable manner.

## State Dimensions

The application has three orthogonal state concerns:

1. **Navigation State**: Which view/screen is currently active
2. **Data Loading State**: Status of GEDCOM data fetching and processing
3. **Operation State**: Status of ongoing operations (visualization, export, etc.)

## Proposed State Machine Structure

```typescript
// Root machine with parallel states
const appMachine = setup({
  types: {
    context: {} as AppContext,
    events: {} as AppEvents,
  },
  actors: {
    loadGedcomData: fromPromise(/* ... */),
    generateArtwork: fromPromise(/* ... */),
    exportArtwork: fromPromise(/* ... */),
  },
  guards: {
    'has data': ({ context }) => context.fullData !== null,
    'has artwork': ({ context }) => context.pipelineResult !== null,
    'has valid dataset': ({ context, event }) => /* validation logic */,
  }
}).createMachine({
  id: 'app',
  type: 'parallel',
  context: initialContext,
  states: {
    Navigation: {
      initial: 'File Select',
      states: {
        'File Select': {
          on: {
            'Select dataset': {
              target: 'Artwork',
              actions: 'setCurrentDataset'
            },
            'Upload file': {
              target: 'Artwork',
              actions: 'setUploadedFile'
            }
          }
        },
        Artwork: {
          type: 'parallel',
          states: {
            View: {
              initial: 'Canvas',
              states: {
                Canvas: {
                  on: {
                    'Open pipeline': 'Pipeline',
                    'Open export': 'Export'
                  }
                },
                Pipeline: {
                  on: {
                    'Close pipeline': 'Canvas'
                  }
                },
                Export: {
                  on: {
                    'Close export': 'Canvas'
                  }
                }
              }
            },
            'Data Loading': {
              initial: 'Idle',
              states: {
                Idle: {
                  always: {
                    target: 'Loading',
                    guard: 'has valid dataset'
                  }
                },
                Loading: {
                  invoke: {
                    src: 'loadGedcomData',
                    onDone: {
                      target: 'Success',
                      actions: 'storeGedcomData'
                    },
                    onError: {
                      target: 'Error',
                      actions: 'storeError'
                    }
                  }
                },
                Success: {
                  on: {
                    'Reload data': 'Loading'
                  }
                },
                Error: {
                  on: {
                    'Retry': 'Loading'
                  }
                }
              }
            }
          },
          on: {
            'Switch dataset': {
              target: 'Artwork',
              actions: 'setCurrentDataset'
            },
            'Back to file select': 'File Select'
          }
        }
      }
    },
    Operations: {
      initial: 'Idle',
      states: {
        Idle: {
          on: {
            'Generate artwork': {
              target: 'Generating',
              guard: 'has data'
            },
            'Export artwork': {
              target: 'Exporting',
              guard: 'has artwork'
            }
          }
        },
        Generating: {
          invoke: {
            src: 'generateArtwork',
            onDone: {
              target: 'Idle',
              actions: 'storePipelineResult'
            },
            onError: {
              target: 'Idle',
              actions: 'logGenerationError'
            }
          },
          on: {
            'Update progress': {
              actions: 'updateGenerationProgress'
            }
          }
        },
        Exporting: {
          initial: 'Choosing Format',
          states: {
            'Choosing Format': {
              on: {
                'Export web': 'Exporting Web',
                'Export print': 'Exporting Print',
                'Cancel export': '#app.Operations.Idle'
              }
            },
            'Exporting Web': {
              invoke: {
                src: 'exportArtwork',
                data: { format: 'web' },
                onDone: {
                  target: '#app.Operations.Idle',
                  actions: 'notifyExportSuccess'
                },
                onError: {
                  target: '#app.Operations.Idle',
                  actions: 'notifyExportError'
                }
              }
            },
            'Exporting Print': {
              invoke: {
                src: 'exportArtwork',
                data: { format: 'print' },
                onDone: {
                  target: '#app.Operations.Idle',
                  actions: 'notifyExportSuccess'
                },
                onError: {
                  target: '#app.Operations.Idle',
                  actions: 'notifyExportError'
                }
              }
            }
          }
        }
      }
    }
  }
});
```

## Context Structure

```typescript
interface AppContext {
  // Data
  fullData: GedcomDataWithMetadata | null;
  llmData: LLMReadyData | null;
  pipelineResult: PipelineResult | null;

  // Dataset management
  currentDataset: string | null;
  availableDatasets: string[];

  // UI state
  primaryIndividualId: string | null;
  activeTransformerIds: TransformerId[];
  transformerParameters: Record<string, TransformerParameters>;

  // Operation progress
  generationProgress: {
    current: number;
    total: number;
    transformerName: string;
  } | null;

  // Error handling
  lastError: string | null;
}
```

## Event Types

```typescript
type AppEvents =
  // Navigation events
  | { type: 'Select dataset'; datasetId: string }
  | { type: 'Upload file'; file: File }
  | { type: 'Switch dataset'; datasetId: string }
  | { type: 'Back to file select' }
  | { type: 'Open pipeline' }
  | { type: 'Close pipeline' }
  | { type: 'Open export' }
  | { type: 'Close export' }

  // Data events
  | { type: 'Reload data' }
  | { type: 'Retry' }

  // Operation events
  | { type: 'Generate artwork' }
  | { type: 'Update progress'; progress: GenerationProgress }
  | { type: 'Export artwork' }
  | { type: 'Export web' }
  | { type: 'Export print' }
  | { type: 'Cancel export' }

  // Pipeline configuration
  | { type: 'Set primary individual'; individualId: string }
  | { type: 'Add transformer'; transformerId: TransformerId }
  | { type: 'Remove transformer'; transformerId: string }
  | { type: 'Reorder transformers'; newOrder: TransformerId[] }
  | {
      type: 'Update parameters';
      transformerId: string;
      parameters: TransformerParameters;
    };
```

## Key Benefits

### 1. Clear State Boundaries

- Parallel states handle independent concerns without interference
- Navigation flow is separate from data loading and operations
- Each state region has clear responsibilities

### 2. Type Safety

- Full TypeScript support with XState v5's `setup()` function
- Strongly typed context, events, and actors
- Compile-time validation of state transitions

### 3. Predictable Behavior

- Guards prevent invalid transitions (e.g., can't export without artwork)
- Actors handle async operations cleanly
- Error states are explicit and recoverable

### 4. Progressive Enhancement

- Can start with basic states and add complexity incrementally
- Easy to add new operations or views
- Existing functionality remains stable

## Migration Strategy

### Phase 1: Core Machine Setup

1. Create the basic machine structure with navigation states
2. Migrate existing @xstate/store to full XState machine
3. Connect to React components via `@xstate/react`

### Phase 2: Data Loading Integration

1. Replace current loading logic with XState actors
2. Implement proper error handling and retry logic
3. Add loading state indicators throughout UI

### Phase 3: Operation Management

1. Move visualization generation to state machine
2. Add export functionality with progress tracking
3. Implement cancellation support for long operations

### Phase 4: Enhanced Features

1. Add undo/redo for pipeline configuration
2. Implement state persistence (localStorage)
3. Add keyboard shortcuts via state machine

## React Integration

### Context Provider Setup

```typescript
import { createActorContext } from '@xstate/react';
import { appMachine } from './machines/app.machine';

// Create the actor context
export const AppMachineContext = createActorContext(appMachine);

// App root component
export function App() {
  return (
    <AppMachineContext.Provider>
      <Router>
        <Routes>
          {/* Your app routes */}
        </Routes>
      </Router>
    </AppMachineContext.Provider>
  );
}
```

### Using useActorRef and useSelector in Components

```typescript
import { useActorRef, useSelector } from '@xstate/react';
import { AppMachineContext } from './app-machine-context';

// Selectors for derived state (memoized for performance)
const selectIsLoading = (state: AppMachineState) =>
  state.matches({ Navigation: { Artwork: { 'Data Loading': 'Loading' } } });

const selectHasData = (state: AppMachineState) =>
  state.context.fullData !== null;

const selectHasArtwork = (state: AppMachineState) =>
  state.context.pipelineResult !== null;

const selectCurrentView = (state: AppMachineState) =>
  state.value.navigation;

const selectFamilyTreeData = (state: AppMachineState) =>
  state.context.fullData && state.context.llmData
    ? { full: state.context.fullData, llm: state.context.llmData }
    : null;

const selectPipelineResult = (state: AppMachineState) =>
  state.context.pipelineResult;

const selectError = (state: AppMachineState) =>
  state.context.lastError;

const selectAvailableDatasets = (state: AppMachineState) =>
  state.context.availableDatasets;

const selectCurrentDataset = (state: AppMachineState) =>
  state.context.currentDataset;

// Component using selectors
export function ArtworkView() {
  const actorRef = AppMachineContext.useActorRef();

  // Subscribe only to specific state slices
  const isLoading = AppMachineContext.useSelector(selectIsLoading);
  const hasData = AppMachineContext.useSelector(selectHasData);
  const familyTreeData = AppMachineContext.useSelector(selectFamilyTreeData);
  const pipelineResult = AppMachineContext.useSelector(selectPipelineResult);

  // Send events via actorRef
  const handleGenerateArtwork = () => {
    actorRef.send({ type: 'Generate artwork' });
  };

  const handleExport = () => {
    actorRef.send({ type: 'Export artwork' });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!hasData) {
    return <EmptyState />;
  }

  return (
    <div>
      <Canvas pipelineResult={pipelineResult} />
      <button onClick={handleGenerateArtwork}>Generate</button>
      <button onClick={handleExport}>Export</button>
    </div>
  );
}

// Component with multiple selectors
export function DatasetSelector() {
  const actorRef = AppMachineContext.useActorRef();

  const availableDatasets = AppMachineContext.useSelector(selectAvailableDatasets);
  const currentDataset = AppMachineContext.useSelector(selectCurrentDataset);
  const isLoading = AppMachineContext.useSelector(selectIsLoading);

  const handleSelectDataset = (datasetId: string) => {
    actorRef.send({ type: 'Select dataset', datasetId });
  };

  return (
    <select
      value={currentDataset ?? ''}
      onChange={(e) => handleSelectDataset(e.target.value)}
      disabled={isLoading}
    >
      {availableDatasets.map(dataset => (
        <option key={dataset} value={dataset}>
          {dataset}
        </option>
      ))}
    </select>
  );
}
```

### Creating Custom Hooks with Selectors

```typescript
// Custom hook for pipeline state
export function usePipelineState() {
  const actorRef = AppMachineContext.useActorRef();

  const transformers = AppMachineContext.useSelector(
    (state) => state.context.activeTransformerIds,
  );

  const parameters = AppMachineContext.useSelector(
    (state) => state.context.transformerParameters,
  );

  const isGenerating = AppMachineContext.useSelector((state) =>
    state.matches('Operations.Generating'),
  );

  const progress = AppMachineContext.useSelector(
    (state) => state.context.generationProgress,
  );

  return {
    transformers,
    parameters,
    isGenerating,
    progress,
    addTransformer: (id: TransformerId) =>
      actorRef.send({ type: 'Add transformer', transformerId: id }),
    removeTransformer: (id: string) =>
      actorRef.send({ type: 'Remove transformer', transformerId: id }),
    updateParameters: (id: string, params: TransformerParameters) =>
      actorRef.send({
        type: 'Update parameters',
        transformerId: id,
        parameters: params,
      }),
  };
}

// Custom hook for navigation state
export function useNavigationState() {
  const actorRef = AppMachineContext.useActorRef();

  const currentView = AppMachineContext.useSelector(selectCurrentView);
  const canGoBack = AppMachineContext.useSelector((state) =>
    state.can({ type: 'Back to file select' }),
  );

  return {
    currentView,
    canGoBack,
    navigateToFileSelect: () => actorRef.send({ type: 'Back to file select' }),
    openPipeline: () => actorRef.send({ type: 'Open pipeline' }),
    closePipeline: () => actorRef.send({ type: 'Close pipeline' }),
  };
}
```

### Performance Optimizations

```typescript
// Composite selectors with createSelector for derived state
import { createSelector } from 'reselect';

const selectIndividuals = (state: AppMachineState) =>
  state.context.fullData?.individuals ?? {};

const selectPrimaryIndividualId = (state: AppMachineState) =>
  state.context.primaryIndividualId;

// Memoized selector for primary individual
const selectPrimaryIndividual = createSelector(
  [selectIndividuals, selectPrimaryIndividualId],
  (individuals, primaryId) =>
    primaryId ? individuals[primaryId] : null
);

// Memoized selector for statistics
const selectStatistics = createSelector(
  [selectIndividuals],
  (individuals) => ({
    totalIndividuals: Object.keys(individuals).length,
    withBirthDates: Object.values(individuals).filter(i => i.birthDate).length,
    withDeathDates: Object.values(individuals).filter(i => i.deathDate).length,
  })
);

// Component using memoized selectors
export function StatisticsPanel() {
  const statistics = AppMachineContext.useSelector(selectStatistics);
  const primaryIndividual = AppMachineContext.useSelector(selectPrimaryIndividual);

  return (
    <div>
      <h3>Statistics</h3>
      <p>Total individuals: {statistics.totalIndividuals}</p>
      <p>With birth dates: {statistics.withBirthDates}</p>
      <p>With death dates: {statistics.withDeathDates}</p>
      {primaryIndividual && (
        <p>Primary: {primaryIndividual.name}</p>
      )}
    </div>
  );
}
```

### Testing with Actor Context

```typescript
import { createActor } from 'xstate';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ArtworkView', () => {
  it('should generate artwork when button clicked', async () => {
    const mockMachine = appMachine.withConfig({
      actions: {
        // Mock actions
      },
      actors: {
        // Mock actors
      }
    });

    render(
      <AppMachineContext.Provider machine={mockMachine}>
        <ArtworkView />
      </AppMachineContext.Provider>
    );

    const generateButton = screen.getByText('Generate');
    await userEvent.click(generateButton);

    // Assert state changes
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });
});
```

## State Visualization

The state machine can be visualized using XState's visualization tools:

```
┌─────────────────────────────────────────┐
│              App Machine                 │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────────┐  ┌──────────────┐    │
│  │  Navigation  │  │  Operations  │    │
│  │              │  │              │    │
│  │ ┌──────────┐ │  │ ┌──────────┐ │    │
│  │ │FileSelect│ │  │ │   Idle   │ │    │
│  │ └──────────┘ │  │ └──────────┘ │    │
│  │      ↓       │  │      ↓       │    │
│  │ ┌──────────┐ │  │ ┌──────────┐ │    │
│  │ │ Artwork  │ │  │ │Generating│ │    │
│  │ │          │ │  │ └──────────┘ │    │
│  │ │ ┌──────┐ │ │  │      ↓       │    │
│  │ │ │Canvas│ │ │  │ ┌──────────┐ │    │
│  │ │ └──────┘ │ │  │ │Exporting │ │    │
│  │ └──────────┘ │  │ └──────────┘ │    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

## Testing Strategy

### Unit Tests

- Test individual state transitions
- Verify guards work correctly
- Test context updates

### Integration Tests

- Test complete user flows
- Verify async operations complete
- Test error recovery paths

### E2E Tests

- Test real user interactions
- Verify state persistence
- Test performance with large datasets

## Performance Considerations

1. **Context Updates**: Use immer for immutable updates
2. **Selectors**: Memoize derived state with `useSelector`
3. **Actors**: Cancel ongoing operations when navigating away
4. **Subscriptions**: Clean up listeners properly

## Pipeline Integration

The pipeline functionality is managed through a separate state machine that runs as an actor within the main app machine. This provides:

- **Independent pipeline configuration and execution states**
- **Partial execution capabilities** (run only segments of the pipeline)
- **Live preview during configuration changes**
- **Result caching with smart invalidation**
- **Pause/resume functionality for long-running pipelines**

See [xstate-pipeline-architecture.md](./xstate-pipeline-architecture.md) for detailed pipeline machine specification.

### Key Pipeline Features

1. **Execution Modes**

   - Full: Run entire pipeline from start to finish
   - Partial: Run specific segments (e.g., transformers 2-4)
   - Incremental: Continue from last successful transformer

2. **Configuration Management**

   - Add/remove/reorder transformers
   - Update parameters with validation
   - Live preview with debouncing

3. **Performance Optimization**
   - Result caching between runs
   - Smart cache invalidation on parameter changes
   - Parallel state regions for independent operations

## Conclusion

This XState v5 architecture provides a robust foundation for managing the complex state requirements of the Generation Art application. The parallel state regions handle different concerns independently while maintaining type safety and predictability throughout the application. The pipeline subsystem demonstrates how complex features can be modeled as separate machines and composed into the main application state.
