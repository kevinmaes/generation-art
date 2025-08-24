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
    hasData: ({ context }) => context.fullData !== null,
    hasArtwork: ({ context }) => context.pipelineResult !== null,
    hasValidDataset: ({ context, event }) => /* validation logic */,
  }
}).createMachine({
  id: 'app',
  type: 'parallel',
  context: initialContext,
  states: {
    navigation: {
      initial: 'fileSelect',
      states: {
        fileSelect: {
          on: {
            SELECT_DATASET: {
              target: 'artwork',
              actions: 'setCurrentDataset'
            },
            UPLOAD_FILE: {
              target: 'artwork',
              actions: 'setUploadedFile'
            }
          }
        },
        artwork: {
          type: 'parallel',
          states: {
            view: {
              initial: 'canvas',
              states: {
                canvas: {
                  on: {
                    OPEN_PIPELINE: 'pipeline',
                    OPEN_EXPORT: 'export'
                  }
                },
                pipeline: {
                  on: {
                    CLOSE_PIPELINE: 'canvas'
                  }
                },
                export: {
                  on: {
                    CLOSE_EXPORT: 'canvas'
                  }
                }
              }
            },
            dataLoading: {
              initial: 'idle',
              states: {
                idle: {
                  always: {
                    target: 'loading',
                    guard: 'hasValidDataset'
                  }
                },
                loading: {
                  invoke: {
                    src: 'loadGedcomData',
                    onDone: {
                      target: 'success',
                      actions: 'storeGedcomData'
                    },
                    onError: {
                      target: 'error',
                      actions: 'storeError'
                    }
                  }
                },
                success: {
                  on: {
                    RELOAD_DATA: 'loading'
                  }
                },
                error: {
                  on: {
                    RETRY: 'loading'
                  }
                }
              }
            }
          },
          on: {
            SWITCH_DATASET: {
              target: 'artwork',
              actions: 'setCurrentDataset'
            },
            BACK_TO_FILE_SELECT: 'fileSelect'
          }
        }
      }
    },
    operations: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            GENERATE_ARTWORK: {
              target: 'generating',
              guard: 'hasData'
            },
            EXPORT_ARTWORK: {
              target: 'exporting',
              guard: 'hasArtwork'
            }
          }
        },
        generating: {
          invoke: {
            src: 'generateArtwork',
            onDone: {
              target: 'idle',
              actions: 'storePipelineResult'
            },
            onError: {
              target: 'idle',
              actions: 'logGenerationError'
            }
          },
          on: {
            UPDATE_PROGRESS: {
              actions: 'updateGenerationProgress'
            }
          }
        },
        exporting: {
          initial: 'choosingFormat',
          states: {
            choosingFormat: {
              on: {
                EXPORT_WEB: 'exportingWeb',
                EXPORT_PRINT: 'exportingPrint',
                CANCEL_EXPORT: '#app.operations.idle'
              }
            },
            exportingWeb: {
              invoke: {
                src: 'exportArtwork',
                data: { format: 'web' },
                onDone: {
                  target: '#app.operations.idle',
                  actions: 'notifyExportSuccess'
                },
                onError: {
                  target: '#app.operations.idle',
                  actions: 'notifyExportError'
                }
              }
            },
            exportingPrint: {
              invoke: {
                src: 'exportArtwork',
                data: { format: 'print' },
                onDone: {
                  target: '#app.operations.idle',
                  actions: 'notifyExportSuccess'
                },
                onError: {
                  target: '#app.operations.idle',
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
  | { type: 'SELECT_DATASET'; datasetId: string }
  | { type: 'UPLOAD_FILE'; file: File }
  | { type: 'SWITCH_DATASET'; datasetId: string }
  | { type: 'BACK_TO_FILE_SELECT' }
  | { type: 'OPEN_PIPELINE' }
  | { type: 'CLOSE_PIPELINE' }
  | { type: 'OPEN_EXPORT' }
  | { type: 'CLOSE_EXPORT' }

  // Data events
  | { type: 'RELOAD_DATA' }
  | { type: 'RETRY' }

  // Operation events
  | { type: 'GENERATE_ARTWORK' }
  | { type: 'UPDATE_PROGRESS'; progress: GenerationProgress }
  | { type: 'EXPORT_ARTWORK' }
  | { type: 'EXPORT_WEB' }
  | { type: 'EXPORT_PRINT' }
  | { type: 'CANCEL_EXPORT' }

  // Pipeline configuration
  | { type: 'SET_PRIMARY_INDIVIDUAL'; individualId: string }
  | { type: 'ADD_TRANSFORMER'; transformerId: TransformerId }
  | { type: 'REMOVE_TRANSFORMER'; transformerId: string }
  | { type: 'REORDER_TRANSFORMERS'; newOrder: TransformerId[] }
  | {
      type: 'UPDATE_PARAMETERS';
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

```typescript
// Custom hook for app machine
export const useAppMachine = () => {
  const [state, send] = useMachine(appMachine);

  return {
    // State selectors
    isLoading: state.matches({
      navigation: { artwork: { dataLoading: 'loading' } },
    }),
    hasData: state.context.fullData !== null,
    hasArtwork: state.context.pipelineResult !== null,
    currentView: state.value.navigation,

    // Actions
    selectDataset: (datasetId: string) =>
      send({ type: 'SELECT_DATASET', datasetId }),
    generateArtwork: () => send({ type: 'GENERATE_ARTWORK' }),
    exportArtwork: () => send({ type: 'EXPORT_ARTWORK' }),

    // Context
    data: state.context.fullData
      ? {
          full: state.context.fullData,
          llm: state.context.llmData,
        }
      : null,
    pipelineResult: state.context.pipelineResult,
    error: state.context.lastError,
  };
};
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

## Conclusion

This XState v5 architecture provides a robust foundation for managing the complex state requirements of the Generation Art application. The parallel state regions handle different concerns independently while maintaining type safety and predictability throughout the application.
