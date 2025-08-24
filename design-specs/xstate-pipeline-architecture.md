# XState Pipeline Architecture

## Overview

This document extends the main XState architecture to include comprehensive pipeline state management. The pipeline system is modeled as a separate state machine that can be invoked as an actor from the main app machine.

## Pipeline State Dimensions

The pipeline has two orthogonal concerns:

1. **Configuration State**: Managing the pipeline structure (transformers, parameters, ordering)
2. **Execution State**: Running transformers and managing partial/full execution

## Pipeline Machine Structure

```typescript
// Pipeline machine that can be invoked as an actor
const pipelineMachine = setup({
  types: {
    context: {} as PipelineContext,
    events: {} as PipelineEvents,
    input: {} as PipelineInput,
  },
  actors: {
    runTransformer: fromPromise(/* transformer execution */),
    validateConfiguration: fromPromise(/* config validation */),
  },
  guards: {
    'has valid configuration': ({ context }) => context.transformers.length > 0,
    'can execute segment': ({ context, event }) => /* validation logic */,
    'has more transformers': ({ context }) => 
      context.executionIndex < context.transformers.length - 1,
  }
}).createMachine({
  id: 'pipeline',
  type: 'parallel',
  context: ({ input }) => ({
    // Configuration
    transformers: input.transformers ?? [],
    parameters: input.parameters ?? {},
    primaryIndividualId: input.primaryIndividualId,
    
    // Execution
    executionMode: 'full', // 'full' | 'partial' | 'incremental'
    executionIndex: 0,
    targetIndex: null,
    results: [],
    intermediateResults: new Map(),
    currentResult: null,
    
    // Status
    lastError: null,
    isDirty: false,
  }),
  states: {
    Configuration: {
      initial: 'Idle',
      states: {
        Idle: {
          on: {
            'Add transformer': {
              actions: 'addTransformer',
              target: 'Validating'
            },
            'Remove transformer': {
              actions: 'removeTransformer',
              target: 'Validating'
            },
            'Reorder transformers': {
              actions: 'reorderTransformers',
              target: 'Validating'
            },
            'Update parameters': {
              actions: 'updateParameters',
              target: 'Validating'
            },
            'Set primary individual': {
              actions: 'setPrimaryIndividual',
              target: 'Validating'
            }
          }
        },
        Validating: {
          invoke: {
            src: 'validateConfiguration',
            onDone: {
              target: 'Valid',
              actions: 'markConfigurationValid'
            },
            onError: {
              target: 'Invalid',
              actions: 'storeValidationError'
            }
          }
        },
        Valid: {
          entry: 'markAsDirty',
          on: {
            // Same events as idle, but configuration is known valid
            'Add transformer': {
              actions: 'addTransformer',
              target: 'Validating'
            },
            'Remove transformer': {
              actions: 'removeTransformer',
              target: 'Validating'
            },
            'Reorder transformers': {
              actions: 'reorderTransformers',
              target: 'Validating'
            },
            'Update parameters': {
              actions: 'updateParameters',
              target: 'Validating'
            }
          }
        },
        Invalid: {
          on: {
            // Allow fixing configuration
            'Remove transformer': {
              actions: 'removeTransformer',
              target: 'Validating'
            },
            'Update parameters': {
              actions: 'updateParameters',
              target: 'Validating'
            }
          }
        }
      }
    },
    Execution: {
      initial: 'Idle',
      states: {
        Idle: {
          on: {
            'Execute full': {
              target: 'Preparing',
              guard: 'has valid configuration',
              actions: assign({
                executionMode: 'full',
                executionIndex: 0,
                targetIndex: ({ context }) => context.transformers.length - 1
              })
            },
            'Execute partial': {
              target: 'Preparing',
              guard: 'can execute segment',
              actions: assign({
                executionMode: 'partial',
                executionIndex: ({ event }) => event.startIndex ?? 0,
                targetIndex: ({ event }) => event.endIndex
              })
            },
            'Execute incremental': {
              target: 'Preparing',
              guard: 'has valid configuration',
              actions: assign({
                executionMode: 'incremental',
                executionIndex: ({ context }) => context.results.length,
                targetIndex: ({ event }) => event.targetIndex ?? context.transformers.length - 1
              })
            }
          }
        },
        Preparing: {
          entry: 'prepareExecutionContext',
          always: {
            target: 'Running'
          }
        },
        Running: {
          initial: 'Executing Transformer',
          states: {
            'Executing Transformer': {
              invoke: {
                src: 'runTransformer',
                input: ({ context }) => ({
                  transformer: context.transformers[context.executionIndex],
                  parameters: context.parameters[context.executionIndex],
                  previousResult: context.executionIndex > 0 
                    ? context.results[context.executionIndex - 1]
                    : null,
                  primaryIndividualId: context.primaryIndividualId
                }),
                onDone: {
                  target: 'Checking Progress',
                  actions: 'storeTransformerResult'
                },
                onError: {
                  target: '#pipeline.Execution.Error',
                  actions: 'storeExecutionError'
                }
              },
              on: {
                'Update progress': {
                  actions: 'broadcastProgress'
                },
                'Pause execution': 'Paused',
                'Cancel execution': '#pipeline.Execution.Cancelled'
              }
            },
            'Checking Progress': {
              always: [
                {
                  target: 'Executing Transformer',
                  guard: and(['has more transformers', 'not reached target']),
                  actions: 'incrementExecutionIndex'
                },
                {
                  target: '#pipeline.Execution.Completed'
                }
              ]
            },
            Paused: {
              on: {
                'Resume execution': 'Executing Transformer',
                'Cancel execution': '#pipeline.Execution.Cancelled'
              }
            }
          }
        },
        Completed: {
          entry: ['finalizeResults', 'markAsClean'],
          on: {
            'Execute full': {
              target: 'Preparing',
              guard: 'has valid configuration'
            },
            'Execute partial': {
              target: 'Preparing',
              guard: 'can execute segment'
            },
            'Continue execution': {
              target: 'Preparing',
              actions: assign({
                executionMode: 'incremental',
                executionIndex: ({ context }) => context.results.length
              })
            }
          }
        },
        Error: {
          on: {
            'Retry execution': {
              target: 'Preparing',
              actions: 'clearError'
            },
            'Retry from failed': {
              target: 'Preparing',
              actions: ['clearError', 'setExecutionIndexToFailed']
            },
            'Cancel execution': 'Cancelled'
          }
        },
        Cancelled: {
          entry: 'cleanupExecution',
          on: {
            'Execute full': {
              target: 'Preparing',
              guard: 'has valid configuration'
            }
          }
        }
      }
    },
    Preview: {
      // Handles live preview during configuration changes
      initial: 'Inactive',
      states: {
        Inactive: {
          on: {
            'Enable preview': 'Active'
          }
        },
        Active: {
          on: {
            'Disable preview': 'Inactive',
            'Configuration changed': {
              actions: 'debouncePreviewUpdate'
            }
          },
          after: {
            500: {
              target: 'Updating',
              guard: 'is dirty'
            }
          }
        },
        Updating: {
          invoke: {
            src: 'generatePreview',
            onDone: {
              target: 'Active',
              actions: 'updatePreview'
            },
            onError: {
              target: 'Active',
              actions: 'logPreviewError'
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
interface PipelineContext {
  // Configuration
  transformers: TransformerConfig[];
  parameters: Record<string, TransformerParameters>;
  primaryIndividualId: string | null;
  
  // Execution state
  executionMode: 'full' | 'partial' | 'incremental';
  executionIndex: number;
  targetIndex: number | null;
  results: PipelineResult[];
  intermediateResults: Map<string, IntermediateResult>;
  currentResult: PipelineResult | null;
  
  // Caching
  cachedResults: Map<string, CachedResult>;
  cacheKeys: Map<string, string>; // For invalidation
  
  // Status
  lastError: Error | null;
  isDirty: boolean; // Configuration changed since last execution
  isPreviewEnabled: boolean;
  previewResult: PreviewResult | null;
}

interface TransformerConfig {
  id: string;
  type: TransformerId;
  enabled: boolean;
  dependencies?: string[]; // Other transformer IDs this depends on
}

interface CachedResult {
  transformerId: string;
  result: any;
  timestamp: number;
  cacheKey: string;
}
```

## Event Types

```typescript
type PipelineEvents =
  // Configuration events
  | { type: 'Add transformer'; transformer: TransformerConfig; index?: number }
  | { type: 'Remove transformer'; transformerId: string }
  | { type: 'Reorder transformers'; newOrder: string[] }
  | { type: 'Update parameters'; transformerId: string; parameters: TransformerParameters }
  | { type: 'Set primary individual'; individualId: string }
  | { type: 'Toggle transformer'; transformerId: string }
  
  // Execution events
  | { type: 'Execute full' }
  | { type: 'Execute partial'; startIndex?: number; endIndex: number }
  | { type: 'Execute incremental'; targetIndex?: number }
  | { type: 'Continue execution' }
  | { type: 'Pause execution' }
  | { type: 'Resume execution' }
  | { type: 'Cancel execution' }
  | { type: 'Retry execution' }
  | { type: 'Retry from failed' }
  
  // Progress events
  | { type: 'Update progress'; progress: number; message: string }
  
  // Preview events
  | { type: 'Enable preview' }
  | { type: 'Disable preview' }
  | { type: 'Configuration changed' };
```

## Integration with Main App Machine

```typescript
// Updated main app machine with pipeline actor
const appMachine = setup({
  actors: {
    pipelineMachine,
    // ... other actors
  }
}).createMachine({
  // ... main machine config
  states: {
    navigation: {
      states: {
        artwork: {
          type: 'parallel',
          states: {
            // ... other parallel states
            pipeline: {
              initial: 'inactive',
              states: {
                Inactive: {
                  on: {
                    'Initialize pipeline': 'Active'
                  }
                },
                Active: {
                  invoke: {
                    id: 'pipeline',
                    src: 'pipelineMachine',
                    input: ({ context }) => ({
                      transformers: context.activeTransformerIds,
                      parameters: context.transformerParameters,
                      primaryIndividualId: context.primaryIndividualId,
                      fullData: context.fullData,
                      llmData: context.llmData
                    }),
                    onDone: {
                      actions: 'storePipelineResult'
                    }
                  },
                  on: {
                    // Forward events to pipeline actor
                    'Pipeline.*': {
                      actions: forwardTo('pipeline')
                    },
                    // Handle pipeline results
                    'Pipeline completed': {
                      actions: 'updateCanvasWithResult'
                    },
                    'Pipeline partial completed': {
                      actions: 'updateCanvasWithPartialResult'
                    }
                  }
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

## Advanced Pipeline Features

### 1. Partial Execution

```typescript
// Execute only transformers 2-4
send({ 
  type: 'Execute partial', 
  startIndex: 2, 
  endIndex: 4 
});

// The canvas will show results up to transformer 4
// User can continue from transformer 5 later
```

### 2. Incremental Execution

```typescript
// Run pipeline up to transformer 3
send({ 
  type: 'Execute partial', 
  endIndex: 3 
});

// User tweaks transformer 4 parameters
send({ 
  type: 'Update parameters', 
  transformerId: 'transformer-4',
  parameters: newParams 
});

// Continue from transformer 4
send({ 
  type: 'Continue execution' 
});
```

### 3. Caching & Invalidation

```typescript
const cacheKey = generateCacheKey(transformer, parameters, inputData);

// Check cache before execution
if (context.cachedResults.has(cacheKey)) {
  return context.cachedResults.get(cacheKey);
}

// Invalidate downstream caches when parameters change
const invalidateDownstream = (transformerIndex: number) => {
  for (let i = transformerIndex; i < context.transformers.length; i++) {
    context.cachedResults.delete(context.cacheKeys.get(transformers[i].id));
  }
};
```

### 4. Live Preview

```typescript
// Enable preview mode
send({ type: 'Enable preview' });

// As user adjusts parameters, preview updates automatically
// with debouncing to avoid excessive computation
```

### 5. Dependency Management

```typescript
interface TransformerDependency {
  transformerId: string;
  requiredOutput: string[];
  optional?: boolean;
}

// Validate dependencies before execution
const validateDependencies = (transformer: TransformerConfig) => {
  return transformer.dependencies?.every(depId => 
    context.results.some(r => r.transformerId === depId)
  ) ?? true;
};
```

## React Integration with Actor Context

### Pipeline Actor Context Setup

```typescript
import { createActorContext } from '@xstate/react';
import { useActorRef, useSelector } from '@xstate/react';
import { AppMachineContext } from './app-machine-context';

// Selectors for pipeline state
const selectPipelineActor = (state: AppMachineState) => 
  state.children.pipeline;

const selectTransformers = (state: PipelineState) => 
  state.context.transformers;

const selectParameters = (state: PipelineState) => 
  state.context.parameters;

const selectIsRunning = (state: PipelineState) =>
  state.matches('Execution.Running');

const selectIsPaused = (state: PipelineState) =>
  state.matches('Execution.Running.Paused');

const selectIsConfigValid = (state: PipelineState) =>
  state.matches('Configuration.Valid');

const selectResults = (state: PipelineState) =>
  state.context.results;

const selectCurrentResult = (state: PipelineState) =>
  state.context.currentResult;

const selectExecutionProgress = (state: PipelineState) => ({
  mode: state.context.executionMode,
  currentIndex: state.context.executionIndex,
  targetIndex: state.context.targetIndex,
  totalTransformers: state.context.transformers.length
});

const selectIsPreviewEnabled = (state: PipelineState) =>
  state.matches('Preview.Active');

const selectPreviewResult = (state: PipelineState) =>
  state.context.previewResult;

// Custom hook using selectors
export function usePipelineMachine() {
  const appActorRef = AppMachineContext.useActorRef();
  
  // Get pipeline actor from app machine
  const pipelineActor = AppMachineContext.useSelector(selectPipelineActor);
  
  if (!pipelineActor) {
    // Pipeline not initialized yet
    return {
      isInitialized: false,
      initialize: () => appActorRef.send({ type: 'Initialize pipeline' })
    };
  }
  
  // Use selectors for fine-grained subscriptions
  const transformers = useSelector(pipelineActor, selectTransformers);
  const parameters = useSelector(pipelineActor, selectParameters);
  const isRunning = useSelector(pipelineActor, selectIsRunning);
  const isPaused = useSelector(pipelineActor, selectIsPaused);
  const isConfigValid = useSelector(pipelineActor, selectIsConfigValid);
  const results = useSelector(pipelineActor, selectResults);
  const currentResult = useSelector(pipelineActor, selectCurrentResult);
  const executionProgress = useSelector(pipelineActor, selectExecutionProgress);
  const isPreviewEnabled = useSelector(pipelineActor, selectIsPreviewEnabled);
  const previewResult = useSelector(pipelineActor, selectPreviewResult);
  
  return {
    isInitialized: true,
    
    // Configuration
    transformers,
    parameters,
    isConfigValid,
    addTransformer: (transformer: TransformerConfig) => 
      pipelineActor.send({ type: 'Add transformer', transformer }),
    removeTransformer: (id: string) =>
      pipelineActor.send({ type: 'Remove transformer', transformerId: id }),
    updateParameters: (id: string, params: TransformerParameters) =>
      pipelineActor.send({ type: 'Update parameters', transformerId: id, parameters: params }),
    
    // Execution
    execute: () => pipelineActor.send({ type: 'Execute full' }),
    executePartial: (endIndex: number) => 
      pipelineActor.send({ type: 'Execute partial', endIndex }),
    executeIncremental: (targetIndex?: number) =>
      pipelineActor.send({ type: 'Execute incremental', targetIndex }),
    pause: () => pipelineActor.send({ type: 'Pause execution' }),
    resume: () => pipelineActor.send({ type: 'Resume execution' }),
    cancel: () => pipelineActor.send({ type: 'Cancel execution' }),
    
    // State
    isRunning,
    isPaused,
    results,
    currentResult,
    executionProgress,
    
    // Preview
    isPreviewEnabled,
    previewResult,
    togglePreview: () => 
      pipelineActor.send({ 
        type: isPreviewEnabled ? 'Disable preview' : 'Enable preview' 
      })
  };
}

// Granular hooks for specific pipeline concerns
export function usePipelineExecution() {
  const pipelineActor = AppMachineContext.useSelector(selectPipelineActor);
  
  if (!pipelineActor) return null;
  
  const isRunning = useSelector(pipelineActor, selectIsRunning);
  const isPaused = useSelector(pipelineActor, selectIsPaused);
  const progress = useSelector(pipelineActor, selectExecutionProgress);
  
  return {
    isRunning,
    isPaused,
    progress,
    canExecute: !isRunning,
    canPause: isRunning && !isPaused,
    canResume: isRunning && isPaused,
    canCancel: isRunning
  };
}

export function usePipelineResults() {
  const pipelineActor = AppMachineContext.useSelector(selectPipelineActor);
  
  if (!pipelineActor) return null;
  
  const results = useSelector(pipelineActor, selectResults);
  const currentResult = useSelector(pipelineActor, selectCurrentResult);
  
  // Memoized selector for latest result
  const latestResult = useSelector(pipelineActor, (state) => 
    state.context.results[state.context.results.length - 1] ?? null
  );
  
  return {
    results,
    currentResult,
    latestResult,
    hasResults: results.length > 0
  };
}
```

## UI Component Integration

```typescript
function PipelineControls() {
  const pipeline = usePipelineMachine();
  
  return (
    <div>
      {/* Transformer list with drag-and-drop reordering */}
      <TransformerList
        transformers={pipeline.transformers}
        onReorder={pipeline.reorderTransformers}
        onRemove={pipeline.removeTransformer}
        onToggle={pipeline.toggleTransformer}
      />
      
      {/* Execution controls */}
      <ExecutionControls>
        <button 
          onClick={pipeline.execute}
          disabled={!pipeline.isConfigValid || pipeline.isRunning}
        >
          Run Full Pipeline
        </button>
        
        <button
          onClick={() => pipeline.executePartial(3)}
          disabled={!pipeline.isConfigValid || pipeline.isRunning}
        >
          Run to Step 3
        </button>
        
        {pipeline.isRunning && (
          <>
            <button onClick={pipeline.pause}>
              {pipeline.isPaused ? 'Resume' : 'Pause'}
            </button>
            <button onClick={pipeline.cancel}>Cancel</button>
          </>
        )}
      </ExecutionControls>
      
      {/* Live preview toggle */}
      <PreviewToggle
        enabled={pipeline.isPreviewEnabled}
        onToggle={pipeline.togglePreview}
      />
    </div>
  );
}
```

## Benefits of This Architecture

### 1. Separation of Concerns
- Configuration management is separate from execution
- Preview runs independently without affecting main execution
- Caching is transparent to the UI

### 2. Flexible Execution Modes
- Full pipeline execution
- Partial execution to specific steps
- Incremental continuation from previous results
- Pause/resume capability

### 3. Performance Optimization
- Results caching with smart invalidation
- Debounced preview updates
- Parallel state regions for independent operations

### 4. Developer Experience
- Clear state boundaries
- Type-safe events and context
- Predictable state transitions
- Easy testing of individual features

### 5. User Experience
- Live preview of changes
- Ability to run partial pipelines
- Visual feedback on execution progress
- Error recovery without losing configuration

## Testing Strategy

```typescript
describe('Pipeline Machine', () => {
  it('should execute transformers in sequence', async () => {
    const machine = pipelineMachine.withConfig({
      actors: {
        runTransformer: fromPromise(async ({ input }) => {
          // Mock transformer execution
          return { data: `result-${input.transformer.id}` };
        })
      }
    });
    
    const actor = createActor(machine, {
      input: {
        transformers: [
          { id: 't1', type: 'circles' },
          { id: 't2', type: 'connections' }
        ]
      }
    });
    
    actor.start();
    actor.send({ type: 'EXECUTE_FULL' });
    
    await waitFor(actor, state => 
      state.matches('execution.completed')
    );
    
    expect(actor.getSnapshot().context.results).toHaveLength(2);
  });
  
  it('should support partial execution', async () => {
    // Test executing only first 2 of 4 transformers
  });
  
  it('should invalidate cache on parameter change', () => {
    // Test cache invalidation logic
  });
});
```

## Migration Path

### Phase 1: Basic Pipeline Machine
1. Implement core configuration management
2. Add full pipeline execution
3. Connect to existing UI components

### Phase 2: Advanced Execution
1. Add partial execution support
2. Implement pause/resume functionality
3. Add result caching

### Phase 3: Preview & Optimization
1. Implement live preview
2. Add smart caching with invalidation
3. Optimize for large pipelines

### Phase 4: Enhanced Features
1. Add transformer dependencies
2. Implement parallel transformer execution
3. Add pipeline templates/presets