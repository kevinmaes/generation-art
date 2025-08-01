# Smart Layout Transformer Design Specification

## Overview

The Smart Layout Transformer is an AI-powered transformer that leverages LLMs to intelligently position nodes and edges in a family tree visualization. Unlike traditional algorithmic layout approaches, this transformer delegates layout calculations to an LLM, enabling creative and context-aware positioning based on genealogy metadata.

## Architecture

### Integration with Existing System

```
┌─────────────────────────────────────────────────────────────────┐
│                      TransformerContext                           │
├─────────────────────────────────────────────────────────────────┤
│ • gedcomData: Full GEDCOM data (with PII)                        │
│ • llmData: Sanitized LLM-ready data (no PII)                     │
│ • visualMetadata: Current visual state                           │
│ • dimensions: User-selected data dimensions                      │
│ • visual: User-selected visual parameters (incl. layout style)   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Smart Layout Transformer                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. Extract layout style from visual parameters                   │
│ 2. Prepare LLM prompt with:                                      │
│   - LLM-safe metadata (no PII)                                   │
│   - Current visual metadata                                       │
│   - Layout style constraints                                      │
│   - Canvas dimensions                                             │
│ 3. Call LLM to generate new positions                            │
│ 4. Parse and validate LLM response                               │
│ 5. Merge with existing visual metadata                           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TransformerOutput                            │
├─────────────────────────────────────────────────────────────────┤
│ • visualMetadata: Updated positions for nodes/edges              │
│ • debug: LLM prompt/response details                             │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Layout Style Parameter**
   - Type: `select` visual parameter
   - Options: `tree`, `radial`, `grid` (extensible)
   - Passed to LLM to guide layout generation

2. **LLM Integration Service**
   - Handles API communication
   - Manages prompt templates
   - Parses and validates responses

3. **Layout Constraints**
   - Canvas boundaries
   - Node size requirements
   - Edge routing preferences
   - Overlap prevention rules

## LLM Interaction Design

### Input Structure to LLM

```typescript
interface LLMLayoutRequest {
  layoutStyle: 'tree' | 'radial' | 'grid';
  canvasDimensions: { width: number; height: number };
  
  // From llmData (no PII)
  treeMetadata: {
    totalIndividuals: number;
    generationCount: number;
    graphStructure: LLMReadyData['metadata']['graphStructure'];
    familyConnections: {
      id: string;
      parentIds: string[];
      childIds: string[];
      generation: number;
    }[];
  };
  
  // Current positions (if any)
  currentLayout?: {
    individuals: Record<string, { x?: number; y?: number }>;
    edges: Record<string, { points?: { x: number; y: number }[] }>;
  };
  
  // Layout-specific parameters
  layoutParams: {
    nodePadding: number;
    edgeStyle: 'straight' | 'curved';
    centerX: number;
    centerY: number;
  };
}
```

### Expected Output from LLM

```typescript
interface LLMLayoutResponse {
  individuals: Record<string, {
    x: number;
    y: number;
    layer?: number;  // For z-ordering
  }>;
  
  edges?: Record<string, {
    controlPoints?: { x: number; y: number }[];  // For curved edges
  }>;
  
  // Internal metadata for transformer's use (not output to pipeline)
  layoutMetadata?: {
    boundingBox: { x: number; y: number; width: number; height: number };
    centerOfMass: { x: number; y: number };
    layoutQuality?: number;  // 0-1 score for layout success
    layoutDensity?: number;  // 0-1 score for how packed the layout is
  };
}
```

### Using Layout Metadata

The `layoutMetadata` from the LLM is used internally by the transformer for:

1. **Layout validation**:
```typescript
// Ensure all positions are within canvas bounds
const canvasWidth = context.canvasWidth ?? 1000;
const canvasHeight = context.canvasHeight ?? 800;

Object.entries(llmResponse.individuals).forEach(([id, pos]) => {
  // Clamp positions to canvas bounds
  mergedIndividuals[id].x = Math.max(0, Math.min(canvasWidth, pos.x));
  mergedIndividuals[id].y = Math.max(0, Math.min(canvasHeight, pos.y));
});
```

2. **Quality assessment for retry logic**:
```typescript
if (layoutMetadata?.layoutQuality && layoutMetadata.layoutQuality < 0.3) {
  // Could retry with adjusted prompt or parameters
  // But still must work within canvas constraints
  console.warn('Low quality layout detected, but proceeding');
}
```

3. **Debug information only**:
```typescript
return {
  visualMetadata: {
    individuals: mergedIndividuals,
    edges: mergedEdges,
  },
  debug: {
    message: `Smart layout applied: ${layoutStyle}`,
    data: {
      // Include metadata for debugging, but it doesn't affect output
      actualBoundingBox: calculateBoundingBox(mergedIndividuals),
      requestedBoundingBox: layoutMetadata?.boundingBox,
      layoutQuality: layoutMetadata?.layoutQuality,
    }
  }
};
```

The transformer is a pure function that:
- Takes the canvas dimensions as fixed constraints
- Never modifies global settings or canvas properties  
- Only transforms individual/edge positions within bounds
- Uses metadata for internal logic only

### Prompt Template Example

```
You are a layout algorithm for genealogy visualization. Given family tree metadata and current visual properties, calculate new positions while preserving existing visual attributes.

Layout Style: {layoutStyle}
Canvas: {width}x{height}
Temperature: {temperature} (0.0 = precise/deterministic, 1.0 = creative/varied)

User Parameters:
- Node Padding: {nodePadding}
- Spacing: {spacing} (tight/compact/normal/loose/sparse)
- Edge Style: {edgeStyle} (straight/curved)
- Primary Dimension: {primaryDimension} (for emphasis in layout)
- Secondary Dimension: {secondaryDimension} (for variation)
{additionalParameters}

Current Visual State:
{currentVisualMetadata}

Tree Structure:
- Individuals: {totalIndividuals}
- Generations: {generationCount}
- Connections: {familyConnections}

Requirements:
1. MERGE STRATEGY: Build upon existing visual metadata, don't replace it
   - Preserve all properties you don't explicitly change
   - For position changes, consider current positions as starting points
   - Maintain existing colors, sizes, shapes, etc. unless layout requires changes
2. Position all individuals within canvas bounds
3. Apply layout style:
   - tree: Maintain generational hierarchy, top-down flow
   - radial: Center at ({centerX}, {centerY}), generations as rings
   - grid: Uniform spacing, consider primary dimension for ordering
4. Respect user parameters:
   - Ensure minimum padding of {nodePadding} between nodes
   - Apply {spacing} multiplier to distances
   - Consider {primaryDimension} for main layout axis
5. Apply temperature:
   - Low temperature: Strict adherence to layout rules
   - High temperature: More creative/organic positioning

{layoutStyleSpecificInstructions}

Output format (only include properties you're changing):
{
  "individuals": {
    "id1": { "x": 100, "y": 200 },  // Only if position changed
    "id2": { "x": 150, "y": 250, "rotation": 45 }  // Can add properties if needed
  },
  "edges": {
    "edge1": { "controlPoints": [...] }  // Only for curved edges
  }
}
```

### Advanced Prompting Strategies

#### 1. Parameter-Aware Prompting
```typescript
// Determine which parameters affect layout
const layoutRelevantParams = {
  // Always passed
  layoutStyle: visual.layoutStyle,
  nodePadding: visual.nodePadding,
  spacing: visual.spacing,
  
  // Conditionally passed based on layout style
  ...(layoutStyle === 'radial' && {
    radialStartAngle: visual.radialStartAngle,
    radialEndAngle: visual.radialEndAngle,
  }),
  
  ...(layoutStyle === 'grid' && {
    gridColumns: visual.gridColumns,
    gridGutterSize: visual.gridGutterSize,
  }),
  
  // Passed if they affect positioning
  ...(visual.nodeSize && { nodeSize: visual.nodeSize }),
  ...(visual.edgeCurvature && { edgeCurvature: visual.edgeCurvature }),
};
```

#### 2. Merge Instructions by Layout Style
```typescript
const mergeInstructions = {
  tree: `
    - Adjust x positions to create clear hierarchical columns
    - Modify y positions to separate generations
    - Preserve existing colors and sizes unless overcrowding requires adjustment
    - Keep rotation values unless they conflict with tree readability
  `,
  
  radial: `
    - Transform x,y to polar coordinates (r, theta)
    - Preserve relative distances between connected nodes
    - May need to adjust node sizes if rings are crowded
    - Can add rotation to align nodes with radial direction
  `,
  
  grid: `
    - Snap positions to grid while maintaining relationships
    - Preserve visual properties unless grid cell is too small
    - Use existing x,y as hints for preferred grid position
    - Maintain group/cluster information in grid placement
  `
};
```

#### 3. Temperature-Based Instructions
```typescript
function getTemperatureInstructions(temperature: number): string {
  if (temperature < 0.3) {
    return `Apply strict mathematical layout. 
            Positions should be perfectly aligned and evenly spaced.
            No creative variations or organic feel.`;
  } else if (temperature < 0.7) {
    return `Balance structure with natural variation.
            Allow small deviations from perfect alignment.
            Add subtle position adjustments for visual interest.`;
  } else {
    return `Create organic, artistic layout.
            Prioritize visual appeal over strict rules.
            Add creative variations while maintaining readability.`;
  }
}
```

#### 4. Visual Metadata Merging Example
```typescript
// In the transform function
const llmResponse = await llmService.generateLayout(request);

// Merge LLM response with existing metadata
const mergedIndividuals = Object.entries(visualMetadata.individuals)
  .reduce((acc, [id, existingMeta]) => {
    const llmMeta = llmResponse.individuals[id] || {};
    
    // Deep merge: LLM changes override, but preserve untouched properties
    acc[id] = {
      ...existingMeta,      // Keep all existing properties
      ...llmMeta,           // Override with LLM changes
      // Special handling for cumulative properties
      rotation: existingMeta.rotation !== undefined && llmMeta.rotation !== undefined
        ? existingMeta.rotation + llmMeta.rotation  // Additive rotation
        : llmMeta.rotation || existingMeta.rotation,
    };
    
    return acc;
  }, {} as Record<string, VisualMetadata>);
```

#### 5. Context-Aware Prompting
```typescript
// Include relevant context based on what's already been transformed
const contextPrompt = `
Current Pipeline State:
- Previous transformers applied: ${previousTransformerIds.join(', ')}
- Existing layout characteristics: ${describeCurrentLayout(visualMetadata)}
- Visual style: ${inferVisualStyle(visualMetadata)}

Adapt your layout to complement the existing visual style while applying the requested {layoutStyle} structure.
`;
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create `smart-layout.ts` transformer file
2. Add `layoutStyle` to visual parameters system
3. Create LLM service abstraction for API calls
4. Implement basic prompt generation

### Phase 2: Layout Styles
1. Implement "tree" layout (hierarchical, top-down)
2. Add "radial" layout (circular, generation rings)
3. Add "grid" layout (uniform spacing)

### Phase 3: Enhancement
1. Add edge routing for complex connections
2. Implement layout caching for performance
3. Add layout transition animations
4. Create layout quality validation

## Technical Considerations

### Architecture Expansion Requirements

1. **New Visual Parameter Type**
   - Extend visual parameters to support layout-specific options
   - May need to add `layoutStyle` as a special parameter type

2. **LLM Service Integration**
   - Create `services/llm-client.ts` for API abstraction
   - Handle rate limiting and error recovery
   - Support multiple LLM providers (OpenAI, Anthropic, etc.)

3. **Response Validation**
   - Validate all positions are within canvas bounds
   - Ensure all individuals have positions
   - Handle partial/malformed responses gracefully

### Performance Optimizations

1. **Caching Strategy**
   - Cache layouts by tree structure hash
   - Invalidate on parameter changes
   - Store in localStorage for persistence

2. **Progressive Enhancement**
   - Show algorithmic layout immediately
   - Update with LLM layout when ready
   - Smooth transition between layouts

3. **Batch Processing**
   - Group multiple layout requests
   - Optimize API usage for large trees

## Security & Privacy

1. **Data Protection**
   - Only send `llmData` (no PII) to LLM
   - Use individual IDs, not names
   - Strip all personal details from prompts

2. **API Key Management**
   - Store keys in environment variables
   - Support user-provided API keys
   - Implement key rotation

## Future Extensions

1. **Advanced Layout Styles**
   - Force-directed graphs
   - Timeline-based layouts
   - Geographic clustering

2. **Interactive Features**
   - User-guided layout hints
   - Partial re-layout on edit
   - Layout constraint painting

3. **Multi-Model Support**
   - Compare layouts from different LLMs
   - Ensemble approaches
   - Model-specific optimizations

## Detailed Implementation Steps

### Step 1: Create Layout Style Visual Parameter
```typescript
// In visual-parameters.ts, add:
export const layoutStyleParameter = {
  id: 'layoutStyle',
  name: 'Layout Style',
  type: 'select',
  defaultValue: 'tree',
  options: [
    { value: 'tree', label: 'Tree (Hierarchical)' },
    { value: 'radial', label: 'Radial (Circular)' },
    { value: 'grid', label: 'Grid (Uniform)' }
  ],
  description: 'AI-powered layout style for positioning nodes'
};
```

### Step 2: Create LLM Service
```typescript
// services/llm-client.ts
interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
  defaultTemperature?: number;
}

interface LLMLayoutRequest {
  prompt: string;
  temperature: number;  // From context.temperature
  maxTokens?: number;
  responseFormat?: 'json';
}

interface LLMLayoutService {
  generateLayout(request: LLMLayoutRequest): Promise<LLMLayoutResponse>;
  validateResponse(response: unknown): LLMLayoutResponse;
}

// Temperature mapping for different providers
function mapTemperatureToProvider(
  temperature: number, 
  provider: 'openai' | 'anthropic'
): number {
  // Context temperature is 0-1, but providers may have different ranges
  switch (provider) {
    case 'openai':
      return temperature * 2; // OpenAI uses 0-2
    case 'anthropic':
      return temperature;     // Anthropic uses 0-1
    default:
      return temperature;
  }
}
```

### Step 3: Implement Smart Layout Transformer
```typescript
// transformers/smart-layout.ts
export const smartLayoutTransformer: VisualTransformerConfig = {
  id: 'smartLayout',
  name: 'Smart Layout',
  description: 'AI-powered layout that intelligently positions nodes',
  requiresLLM: true,
  
  availableDimensions: ['generation', 'birthYear', 'childrenCount'],
  defaultPrimaryDimension: 'generation',
  
  visualParameters: [
    layoutStyleParameter,
    nodePaddingParameter,
    edgeStyleParameter
  ],
  
  createRuntimeTransformerFunction: (params) => {
    return async (context: TransformerContext) => {
      // 1. Extract layout parameters
      // 2. Build LLM request from llmData
      // 3. Call LLM service
      // 4. Validate and apply positions
      // 5. Return updated visual metadata
    };
  }
};
```

### Step 4: Register Transformer
```typescript
// transformers/transformers.ts
import { smartLayoutTransformer } from './smart-layout';

export const TRANSFORMERS = {
  // ... existing transformers
  smartLayout: smartLayoutTransformer,
};
```

### Step 5: Add Environment Configuration
```typescript
// client/.env.example
VITE_LLM_PROVIDER=openai
VITE_LLM_API_KEY=your-api-key-here
VITE_LLM_MODEL=gpt-4
```

### Step 6: Create Prompt Templates
```typescript
// transformers/smart-layout-prompts.ts
export const layoutPrompts = {
  tree: `Position nodes in hierarchical tree layout...`,
  radial: `Arrange nodes in concentric circles...`,
  grid: `Place nodes in uniform grid pattern...`
};
```

### Step 7: Implement Response Validation
```typescript
// transformers/smart-layout-validation.ts
export function validateLayoutResponse(
  response: unknown,
  expectedIndividuals: string[]
): LLMLayoutResponse {
  // Check all individuals have positions
  // Verify positions within canvas bounds
  // Ensure valid number types
  // Return validated response or throw
}
```

### Step 8: Add Error Handling
```typescript
// Fallback to algorithmic layout on LLM failure
// Retry logic with exponential backoff
// User notification for API errors
// Graceful degradation to cached layouts
```

### Step 9: Performance Optimizations
```typescript
// Layout caching by tree hash
// Progressive rendering during LLM call
// Debounced parameter changes
// Batch layout requests
```

### Step 10: Testing Strategy
1. Unit tests for prompt generation
2. Mock LLM responses for testing
3. Validation edge cases
4. Performance benchmarks
5. Visual regression tests

## Minimal MVP Implementation

For the first iteration, focus on:
1. Basic tree layout style only
2. Simple prompt without edge routing
3. OpenAI integration only
4. No caching or optimization
5. Basic error handling

This allows testing the core concept before expanding to full features.
1. Create `/client/src/transformers/smart-layout.ts`
2. Define the transformer following existing patterns:
   ```typescript
   export const smartLayoutTransformer: VisualTransformerConfig = {
     id: 'smart-layout',
     name: 'Smart Layout',
     description: 'AI-powered layout positioning for family trees',
     requiresLLM: true,
     // ... configuration
   }
   ```
3. Register in transformer index

### Step 2: Add Layout Style Visual Parameter
1. Add to `/client/src/transformers/visual-parameters.ts`:
   ```typescript
   layoutStyle: {
     name: 'Layout Style',
     type: 'select',
     defaultValue: 'tree',
     options: [
       { value: 'tree', label: 'Tree (Hierarchical)' },
       { value: 'radial', label: 'Radial (Circular)' },
       { value: 'grid', label: 'Grid (Uniform)' }
     ]
   }
   ```

### Step 3: Create LLM Service
1. Create `/client/src/services/llm-client.ts`:
   ```typescript
   interface LLMClient {
     generateLayout(request: LLMLayoutRequest): Promise<LLMLayoutResponse>;
   }
   ```
2. Implement provider adapters (OpenAI, Anthropic)
3. Add error handling and retry logic

### Step 4: Implement Transform Function
1. Extract layout parameters from context
2. Build LLM prompt with sanitized data
3. Call LLM service
4. Validate and apply response
5. Handle errors gracefully with fallback

### Step 5: Add Layout Algorithms
1. Tree layout prompt template
2. Radial layout calculations
3. Grid positioning logic
4. Edge routing for each style

### Step 6: Testing & Validation
1. Unit tests for prompt generation
2. Mock LLM responses for testing
3. Validation of output positions
4. Performance benchmarks

### Step 7: UI Integration
1. Add to transformer pipeline modal
2. Show loading state during LLM call
3. Display debug info in development
4. Add layout preview

### Step 8: Documentation
1. Update README with smart transformer info
2. Add usage examples
3. Document API key setup
4. Create troubleshooting guide