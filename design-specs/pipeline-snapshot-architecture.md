# Pipeline Snapshot & Step-Through Architecture

## Overview
This document outlines the architecture for enhancing the generation-art pipeline system with snapshot capabilities and step-through visualization features. The goal is to enable users to:
- Save snapshots of each transformer's output in the pipeline
- Click on any transformer to visualize its output
- Step through transformers sequentially
- Cache results for performance

## Core Concepts
1. **Cumulative State**: Each transformer in the pipeline receives the cumulative visual metadata from all previous transformers and outputs the modified cumulative state. When viewing a transformer's output, we always want to see the cumulative result up to and including that transformer.

2. **Pipeline History**: Every pipeline run is saved to history with its complete configuration, allowing users to revisit, replay, and fork previous pipeline configurations.

## 1. Data Storage Architecture

### Pipeline Cache System (Functional Approach)
```
/client/src/transformers/pipeline-cache/
├── cache-store.ts           // Pure functions for cache operations
├── snapshot-manager.ts      // Pure functions for snapshot management
├── history-manager.ts       // Pure functions for pipeline history
├── storage-adapter.ts       // Pure functions for storage abstraction
└── types.ts                // TypeScript types and interfaces
```

### Key Design Decisions
- **Functional Programming**: Pure functions, no classes, easily testable
- **Hybrid Storage**: Use IndexedDB for persistent storage + in-memory Map for fast access
- **Snapshot Format**: Store the cumulative visual metadata at each transformer step
- **Cache Keys**: `${pipelineId}_${transformerIndex}_${transformerId}_${instanceId}`
- **ID Generation**: Use nanoid for short, readable pipeline IDs (e.g., "pipe-V1StG" or "p-4f3a2b1c")

### Data Structures

#### Transformer Snapshot
```typescript
interface TransformerSnapshot {
  // Metadata
  pipelineId: string;
  transformerIndex: number;
  transformerId: TransformerId;
  instanceId: string;
  timestamp: number;
  
  // The cumulative visual state after this transformer executes
  // This is what gets rendered when viewing this transformer
  visualMetadata: CompleteVisualMetadata;
  
  // Optional: Just what this transformer changed (for debugging/analysis)
  transformerDiff?: Partial<CompleteVisualMetadata>;
  
  // Execution info
  executionTime: number;
  parameters: {
    dimensions: { primary?: string; secondary?: string };
    visual: VisualParameterValues;
  };
}
```

#### Pipeline History Entry
```typescript
interface PipelineHistoryEntry {
  // Unique identifier for this pipeline run
  pipelineId: string;
  
  // Human-readable name (auto-generated or user-defined)
  name: string;  // e.g., "Artistic Layout #3" or user's custom name
  
  // When this pipeline was run
  timestamp: number;
  
  // Complete configuration to recreate this exact pipeline
  config: PipelineConfig;  // Full config including transformers, params, etc.
  
  // Metadata about the run
  metadata: {
    gedcomFileId: string;  // Which GEDCOM file was used
    duration: number;      // Total execution time in ms
    transformerCount: number;
    canvasWidth: number;
    canvasHeight: number;
    temperature: number;
    seed?: string;
  };
  
  // User annotations
  tags?: string[];        // User-defined tags for organization
  notes?: string;         // User notes about this pipeline
  isFavorite?: boolean;   // Mark as favorite for quick access
  
  // Relationship to other pipelines
  forkedFrom?: string;    // If this was duplicated from another pipeline
  
  // Cache status
  cacheStatus: {
    hasSnapshots: boolean;  // Whether snapshots are available
    lastSnapshot?: string;  // ID of the final transformer snapshot
  };
}
```

## 2. Pipeline Execution Enhancements

### Modified Pipeline Generator
The existing `runPipelineGenerator` would be enhanced to:
1. Generate a unique `pipelineId` for each run
2. After each transformer executes, save a snapshot
3. Yield snapshot information along with progress

```typescript
// Enhanced yield type
type PipelineYield =
  | { type: 'snapshot-saved'; 
      snapshot: TransformerSnapshot }
  | { type: 'progress'; 
      current: number; 
      total: number; 
      transformerName: string }
  | { type: 'transformer-result';
      transformerId: string;
      visualMetadata: Partial<CompleteVisualMetadata> }
  | { type: 'complete'; 
      result: PipelineResult }
```

## 3. UI/UX Architecture

### Pipeline Visualization Modes
```typescript
enum PipelineMode {
  FULL_PLAY = 'full',      // Current behavior - run entire pipeline
  STEP_THROUGH = 'step',   // New step-by-step mode
  PREVIEW = 'preview'      // Click transformer to preview its output
}
```

### Component Structure
```
PipelineManager.tsx (enhanced)
├── PipelineStepControls.tsx     // Next/Prev/Play controls
├── TransformerTimeline.tsx      // Visual timeline of transformers
└── SnapshotPreview.tsx          // Preview pane for snapshots
```

### State Management
```typescript
interface PipelineVisualizationState {
  mode: PipelineMode;
  activeTransformerIndex: number | null;  // Which transformer is selected
  snapshots: Map<string, TransformerSnapshot>;
  isPlaying: boolean;
  playbackSpeed: number;  // For animated step-through
}
```

## 4. Pipeline History Management

### History Features
1. **Automatic Saving**: Every pipeline run is automatically saved to history
2. **Browse History**: View a list of all previous pipeline runs with thumbnails
3. **Replay Pipeline**: Click any history entry to reload its exact configuration
4. **Fork Pipeline**: Duplicate a history entry to create a new editable version
5. **Smart Replay**: If snapshots exist, skip re-computation and show final result
6. **Export/Import**: Export pipeline configs as JSON for sharing

### History UI Components
```
PipelineHistory.tsx
├── HistoryList.tsx          // Grid/list view of previous runs
├── HistoryEntry.tsx         // Individual history item with preview
├── HistoryDetails.tsx       // Detailed view of a pipeline config
└── HistoryActions.tsx       // Replay, fork, export, delete actions
```

### History Storage Strategy
```typescript
// Save pipeline to history after successful run
async function savePipelineToHistory(
  pipelineId: string,
  config: PipelineConfig,
  result: PipelineResult
): Promise<void> {
  const historyEntry: PipelineHistoryEntry = {
    pipelineId,
    name: generatePipelineName(), // "Artistic Layout #42"
    timestamp: Date.now(),
    config,
    metadata: {
      gedcomFileId: config.gedcomFileId,
      duration: result.debug.totalExecutionTime,
      transformerCount: config.transformers.length,
      canvasWidth: config.canvasWidth,
      canvasHeight: config.canvasHeight,
      temperature: config.temperature,
      seed: config.seed,
    },
    cacheStatus: {
      hasSnapshots: true,
      lastSnapshot: `${pipelineId}_${config.transformers.length - 1}`,
    },
  };
  
  await saveToHistory(historyEntry);
}

// Replay a pipeline from history
async function replayPipeline(
  historyEntry: PipelineHistoryEntry
): Promise<PipelineResult> {
  // Check if we have cached snapshots
  if (historyEntry.cacheStatus.hasSnapshots) {
    // Load the final snapshot directly
    const finalSnapshot = await getSnapshot(
      historyEntry.pipelineId,
      historyEntry.metadata.transformerCount - 1
    );
    
    if (finalSnapshot) {
      // Return cached result without re-running
      return {
        visualMetadata: finalSnapshot.visualMetadata,
        config: historyEntry.config,
        // ... other fields
      };
    }
  }
  
  // No cache available, re-run the pipeline
  return runPipeline({
    config: historyEntry.config,
    // ... other inputs
  });
}

// Fork a pipeline to create a new editable copy
function forkPipeline(
  historyEntry: PipelineHistoryEntry
): PipelineConfig {
  return {
    ...historyEntry.config,
    // New pipeline will get a new ID when run
    // User can now modify transformers, parameters, etc.
  };
}
```

## 5. User Interaction Flows

### Mode 1: Preview Mode
- User clicks on any transformer in the pipeline
- System loads the snapshot for that transformer
- Canvas renders the visualMetadata from the snapshot (which is cumulative)
- Transformer gets highlighted in the UI
- No need to re-run the pipeline

### Mode 2: Step-Through Mode
- User clicks "Step Mode" button
- Controls appear: `[|< First]` `[< Prev]` `[Next >]` `[Last >|]` `[▶ Play]`
- Each click advances/retreats one transformer
- "Play" animates through with configurable delay
- Visual feedback shows current position in pipeline
- Progress bar indicates position in sequence

### Mode 3: Full Play Mode (Current)
- Current behavior maintained
- Run entire pipeline from start to finish
- But now also saves snapshots for later review
- Progress shown during execution
- Automatically saves to history upon completion

### Mode 4: History Browse Mode
- User opens pipeline history panel
- Sees grid/list of previous pipeline runs with thumbnails
- Can filter by date, tags, favorites
- Clicking a history entry shows:
  - Full transformer list and parameters
  - Option to replay (using cache if available)
  - Option to fork (create editable copy)
  - Option to export as JSON
- Double-clicking loads and replays the pipeline

## 5. Canvas Rendering Architecture

### Rendering Strategy
Instead of always using the full pipeline result, the canvas would accept:
```typescript
interface CanvasRenderSource {
  source: 'pipeline' | 'snapshot';
  data: CompleteVisualMetadata;
  transformerIndex?: number;  // For UI highlighting
}
```

### Component Flow
```
PipelineManager
  ├─> User selects transformer or step
  ├─> Loads snapshot from cache
  ├─> Updates ArtGenerator props with snapshot data
  └─> ArtGenerator renders snapshot visual metadata
```

## 6. Performance Optimizations

### Smart Caching Strategy
- **Memory Limits**: Cap in-memory cache at ~50MB
- **LRU Eviction**: Remove least recently used snapshots when limit reached
- **Compression**: Use LZ-string for JSON compression (reduces size by ~70%)
- **Lazy Loading**: Only load snapshots into memory when needed

### Incremental Storage
- Store diffs between transformers, not full state
- Reconstruct state by applying diffs sequentially
- Reduces storage size significantly
- Faster snapshot comparisons

### Cache Invalidation
- Clear cache when pipeline configuration changes
- Invalidate specific transformer snapshots when parameters change
- Option to manually clear cache in UI

## 7. File Export Features

### Export Options
```typescript
interface ExportOptions {
  format: 'json' | 'json-compressed';
  includeMetadata: boolean;
  exportAll: boolean;  // All snapshots or just selected
  exportPath?: string;  // Custom export location
}
```

### Export Directory Structure
```
/exports/pipeline-{timestamp}/
├── pipeline-config.json           // Pipeline configuration
├── snapshots/
│   ├── 0-horizontal-spread.json  // Individual snapshots
│   ├── 1-vertical-spread.json
│   └── 2-variance.json
├── visual-outputs/               // Optional rendered images
│   ├── 0-horizontal-spread.png
│   ├── 1-vertical-spread.png
│   └── 2-variance.png
└── metadata.json                 // Export metadata
```

### Pipeline Config Export Format
```json
{
  "version": "1.0.0",
  "pipelineId": "pipe-V1StGXR8",
  "name": "Artistic Layout #42",
  "timestamp": 1704067200000,
  "config": {
    "transformers": [
      {
        "type": "horizontal-spread",
        "instanceId": "horizontal-spread-0",
        "dimensions": {
          "primary": "generation",
          "secondary": "birthYear"
        },
        "visual": {
          "spacing": 100,
          "alignment": "center"
        }
      },
      {
        "type": "color-by-dimension",
        "instanceId": "color-by-dimension-1",
        "dimensions": {
          "primary": "gender"
        },
        "visual": {
          "palette": "warm"
        }
      }
    ],
    "temperature": 0.5,
    "seed": "abc123",
    "canvasWidth": 800,
    "canvasHeight": 600
  },
  "metadata": {
    "gedcomFileId": "kennedy.ged",
    "duration": 1523,
    "transformerCount": 2,
    "tags": ["family", "colorful", "generational"],
    "notes": "Nice generational spread with warm colors"
  }
}
```

## 8. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Implement cache-store.ts with pure functions
- [ ] Implement snapshot-manager.ts with in-memory storage
- [ ] Modify pipeline.ts to save snapshots during execution
- [ ] Add snapshot yielding to generator
- [ ] Basic snapshot retrieval functions

### Phase 2: UI Controls (Week 2)
- [ ] Add transformer click-to-preview functionality
- [ ] Implement step-through controls component
- [ ] Create visual timeline component
- [ ] Wire up state management for modes
- [ ] Add mode switcher UI

### Phase 3: Advanced Features (Week 3-4)
- [ ] Add IndexedDB persistence layer
- [ ] Implement export/import functionality
- [ ] Create snapshot comparison view
- [ ] Add animation between snapshots
- [ ] Implement diff-based storage optimization

### Phase 4: Polish & Testing (Week 5)
- [ ] Performance optimization
- [ ] Error handling and recovery
- [ ] User documentation
- [ ] Comprehensive testing
- [ ] Accessibility improvements

## 9. Benefits of This Architecture

### For Users
1. **Instant Preview**: Click any transformer to see its effect immediately
2. **Educational**: Understand how each transformer affects the output
3. **Debugging**: Identify which transformer causes unexpected results
4. **Exploration**: Try different combinations without full re-runs

### For Development
1. **Non-Breaking**: Existing pipeline behavior unchanged
2. **Performance**: Cached snapshots eliminate redundant computation
3. **Reproducible**: Snapshots can be shared/imported for debugging
4. **Extensible**: Easy to add features like A/B comparison, undo/redo

### For Testing
1. **Deterministic**: Snapshots provide consistent test data
2. **Regression Testing**: Compare snapshots across versions
3. **Performance Benchmarking**: Measure transformer execution times

## 10. Technical Considerations

### Browser Compatibility
- IndexedDB: Supported in all modern browsers
- Storage Limits: ~50% of available disk space (browser-dependent)
- Memory Management: Monitor heap usage, implement cleanup

### Security & Privacy
- Snapshots contain visual metadata only (no PII)
- Local storage only (no cloud sync)
- User control over cache clearing

### Error Handling
- Graceful degradation if storage unavailable
- Fallback to re-computation if snapshot missing
- User notification for storage errors

## 11. Future Enhancements

### Potential Features
- **Cloud Sync**: Optional snapshot sharing via cloud storage
- **Collaboration**: Share snapshots with other users
- **Version Control**: Track changes to pipeline configurations
- **AI Integration**: Suggest optimal transformer sequences
- **Performance Analytics**: Track and optimize slow transformers

### Integration Opportunities
- Export to other visualization tools
- Import from design software
- API for programmatic access
- Plugin system for custom transformers

## 12. Questions & Decisions Needed

### Open Questions
1. Should snapshots be automatically saved or require user action?
2. What's the optimal compression strategy for visual metadata?
3. Should we support partial pipeline re-runs from a snapshot?
4. How should we handle very large datasets (>1000 individuals)?

### Design Decisions to Make
1. Maximum cache size limits
2. Snapshot retention policy
3. Export format standards
4. UI/UX for mode switching
5. Performance vs. storage tradeoffs

---

## Appendix: Code Examples

### Example: Using the Pipeline Cache (Functional)
```typescript
import { nanoid } from 'nanoid';
import { saveSnapshot, getSnapshot, clearCache } from './pipeline-cache';

// Generate a short, readable pipeline ID
const pipelineId = `pipe-${nanoid(8)}`; // "pipe-V1StGXR8"

// Save a snapshot
const snapshot = await saveSnapshot({
  pipelineId,
  transformerIndex: 0,
  transformerId: 'horizontal-spread',
  visualMetadata: currentMetadata,  // This is the cumulative state
  // ... other fields
});

// Retrieve a snapshot
const snapshot = await getSnapshot(
  pipelineId,
  0 // transformer index
);

// Clear cache
await clearCache();
```

### Example: Step-Through Controls
```typescript
function PipelineStepControls({ 
  totalSteps, 
  currentStep, 
  onStepChange 
}) {
  return (
    <div className="flex gap-2">
      <button onClick={() => onStepChange(0)}>First</button>
      <button onClick={() => onStepChange(currentStep - 1)}>Prev</button>
      <span>{currentStep + 1} / {totalSteps}</span>
      <button onClick={() => onStepChange(currentStep + 1)}>Next</button>
      <button onClick={() => onStepChange(totalSteps - 1)}>Last</button>
    </div>
  );
}
```

---

*This document is a living specification and will be updated as the implementation progresses.*