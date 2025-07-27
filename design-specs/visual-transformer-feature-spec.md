# 🧠 Cursor Feature Prompt

## 1. The Problem

We are building the core feature of our generative art application: a **VisualTransformer pipeline**. This pipeline will convert privacy-safe, GEDCOM-derived metadata (for individuals, families, and the tree) into **visual attributes** suitable for rendering to a canvas. These attributes include layout positions, scale, colors, lines, shapes, and potentially animation dynamics.

We need help from Cursor to **implement this feature in modular, reviewable stages**, using atomic commits, and building from a shared understanding of the architecture and feature goals.

This pipeline is the creative engine that transforms genealogical data into expressive generative art. Without it, the app is a static visualization tool, not a dynamic art generator.

## 2. Supporting Information

### 🔧 VisualTransformer Concept

Each **VisualTransformer** is a composable unit that:

- Accepts an input object containing:
  - **`metadata`** – parsed, privacy-safe metadata from GEDCOM (individuals, families, tree-wide signals)
  - **`visualMetadata`** – the current set of visual attribute values (e.g. x/y, color, shape, motion attributes)
  - **`temperature`** (optional) – a float to control randomness vs determinism
  - **`seed`** (optional) – a string to support reproducibility
- Produces a **transformed visualMetadata** based on:
  - Its own custom logic (can be rule-based, procedural, or seeded-random)
  - Potential delegation to LLM for layout suggestions or style interpretation
- Can be **chained** with other transformers in sequence
- Must be **order-aware but not order-dependent** — should handle already-transformed states intelligently
- Should be optionally introspectable — for debugging or UI previews

Transformers can be:

- Deterministic (e.g., based on birth decade)
- Stochastic (e.g., with noise influenced by `temperature`)
- LLM-augmented (e.g., interpretive or metaphoric layouts)

### 🧠 LLM Delegation (Optional)

Certain transformers may delegate decision-making to an LLM (given masked metadata). Examples:

- Suggest a layout metaphor (e.g. “spiral for recursive families”)
- Pick color palettes based on structural patterns
- Describe the emotional or historical tone of a tree and apply visual mappings accordingly

These transformers should:

- Never send PII
- Use derived or abstracted summaries only
- Return structured config (e.g., JSON instructions for layout or style)

### 🔁 Pipeline Execution

- Transformers are executed in order, modifying `visualMetadata`
- A special **initializer transformer** sets default layout if none is present
- The `runPipeline()` function executes all transformers with shared metadata, seed, and temperature
- Each transformer must:
  - Handle undefined input attributes
  - Preserve already-transformed attributes unless explicitly overridden

### 🎛 UI Interaction

- The user browses a library of transformers (with descriptions and visual previews)
- Drag and drop transformers into a "pipeline builder"
- Reorder them freely
- Adjust parameters like `temperature`
- Press “Generate Art” to run the pipeline and render the output to canvas

### ✨ Design Philosophy

- Find a middle ground between **creative chaos** and **ancestral structure**
- Favor **emergent complexity** through small, reusable transformers
- Encourage experimentation by making pipelines **transparent and editable**
- Allow creative users to build their own transformers or remix existing ones
- Use randomness sparingly — **structured serendipity**

### Focused Development

- When in doubt, the primary goal is to make the pipeline work end-to-end so that we can actually see the impact of the visual transformations on the canvas.
- It's understood that there's always more detail and transformations that are possible within the pipeline to make things more creative later.
- We can hold off on extensive unit testing during rapid development. We want to move quickly and things will likely change so testing will just slow us down.

### Architecture Decisions & Feedback

#### Code Organization

- **Transformers belong in client app**: All transformer-related code (types, factories, individual transformers) is now in `client/src/transformers/` since they're only used by the client app
- **Shared types only for CLI + Client**: Only types that are used by both CLI and client remain in `shared/types/`
- **Registry pattern**: Central `transformers.ts` file exports all transformers keyed by their slugified IDs
- **Individual transformer files**: Each transformer function is in its own file and exported to the registry

#### Transformer Structure

- **Async by design**: All transformers are async functions, ready for future LLM integration
- **Slugified IDs**: Transformer IDs are automatically generated from readable names (e.g., "Horizontal Spread by Generation" → "horizontal-spread-by-generation")
- **Factory utilities**: Helper functions for creating different types of transformers (simple, merging, replacing)
- **Proper typing**: Full TypeScript support with proper async handling and return types

#### File Structure

```
client/src/transformers/
├── types.ts                    # All transformer-related types
├── factory.ts                  # Factory utilities for creating transformers
├── utils.ts                    # Utility functions (slugification, validation)
├── transformers.ts             # Registry of all transformers
├── horizontal-spread-by-generation.ts  # Individual transformer function
└── transformers.test.ts        # Tests for the transformer system
```

## 3. Steps to Completion

> Cursor, please help implement this feature incrementally. Break each phase into logical commits and use this prompt as a north star for planning.

### ✅ Phase 1: Core VisualTransformer Logic

- [x] Define TypeScript types/interfaces for:
  - `metadata` (uses existing `GedcomDataWithMetadata` from shared)
  - `visualMetadata` (VisualMetadata interface)
  - `VisualTransformerFn` (async function type)
- [x] Create transformer factory utilities (`createSimpleTransformer`, `createMergingTransformer`, etc.)
- [x] Build example transformer: `horizontalSpreadByGeneration`
- [x] Create transformer registry with slugified IDs
- [x] Move all transformer-related code to client app (not shared)
- [x] Make all transformers async (ready for future LLM integration)

### ✅ Phase 2: Chaining and Execution

- [x] Implement `runPipeline()` to chain transformers
- [x] Create `createInitialVisualMetadata()` bootstrapper
- [x] Ensure all transformers can handle partial or pre-transformed input

### ✅ Phase 3: Full Data Integration

- [x] Fix CLI to output full `GedcomDataWithMetadata`
- [x] Update pipeline to accept full data structure
- [x] Enhance transformers to use family relationships
- [x] Implement tree-level analysis capabilities
- [x] Update app components to pass full data through the pipeline
- [x] Remove redundant data conversion in FamilyTreeSketch

### Phase 4: Randomness and Repeatability

- [ ] Integrate seeded pseudo-random generator
- [ ] Respect `temperature` parameter for all non-deterministic logic
- [ ] Ensure pipeline produces repeatable results when seeded

### Phase 5: Optional LLM Delegation

- [ ] Add optional LLM-driven transformers
- [ ] Design a privacy-safe abstraction layer to summarize metadata before sending
- [ ] Create first LLM transformer (e.g., layout metaphor selector)

### Phase 6: UI - Pipeline Management Interface

- [x] Create a transformer registry display
- [x] Build read-only pipeline viewer showing active transformers
- [x] Add syntax-highlighted code editor for metadata inspection
- [x] Implement basic pipeline visualization with proper scrolling
- [ ] Add "Visualize" button for controlled pipeline execution
- [ ] Implement transformer selection for input/output inspection
- [ ] Add drag-and-drop interface with reorderable pipeline
- [ ] Connect pipeline to canvas renderer with "Generate Art" action

#### UI Implementation Details

**Dependencies:**

- `react-syntax-highlighter` - For syntax-highlighted code display
- `@dnd-kit/core` and `@dnd-kit/sortable` - For drag-and-drop functionality (future)

**UI Layout (2x2 Grid):**

1. **Top-Left: "Active Pipeline"**

   - Lists active transformers in execution order
   - Drag handles for reordering (initially read-only)
   - Remove buttons (X) for each transformer
   - Selected transformer highlighted with purple background

2. **Bottom-Left: "Available Transformers"**

   - Lists transformers not currently in pipeline
   - Add buttons (+) to add to pipeline
   - Initially read-only, shows available options

3. **Top-Right: "Input Metadata"**

   - Syntax-highlighted JSON showing input data
   - Scrollable code blocks with proper formatting
   - Shows pipeline input or selected transformer input

4. **Bottom-Right: "Output Metadata"**
   - Syntax-highlighted JSON showing output data
   - Scrollable code blocks with proper formatting
   - Shows pipeline output or selected transformer output

**Pipeline Execution Workflow:**

1. **Initial State**:

   - No visualization until "Visualize" button is clicked
   - Input panel shows what the pipeline input would be
   - Output panel shows "Click Visualize to flow data through the pipeline"

2. **Visualize Button**:

   - Only enabled when data is loaded AND pipeline has at least 1 transformer
   - Triggers pipeline execution when clicked
   - Shows loading state during execution

3. **After Visualization**:

   - Canvas displays the generated artwork
   - Input panel shows the complete pipeline input object
   - Output panel shows the complete pipeline output object
   - Visualization persists until "Visualize" is clicked again

4. **Pipeline Modification**:

   - Users can modify transformers, order, parameters between runs
   - Changes don't automatically trigger re-visualization
   - Must click "Visualize" again to see changes

5. **Future: Transformer Selection**:
   - Users can select single or multiple contiguous transformers
   - Input panel shows input to first selected transformer
   - Output panel shows output from last selected transformer
   - Enables detailed inspection of pipeline stages

**Implementation Priority:**

1. **Phase 6a: Read-Only Pipeline Viewer** ✅ (Complete)

   - Display current pipeline configuration
   - Show transformer execution order
   - Basic metadata inspection with syntax highlighting

2. **Phase 6b: Visualize Button & Controlled Execution** (Current)

   - Add "Visualize" button with proper state management
   - Implement controlled pipeline execution
   - Show complete pipeline input/output in code panels

3. **Phase 6c: Interactive Pipeline Builder** (Future)

   - Drag-and-drop reordering
   - Add/remove transformers
   - Real-time pipeline modification

4. **Phase 6d: Transformer Selection** (Future)
   - Select individual or multiple transformers
   - Show transformer-specific input/output
   - Detailed pipeline stage inspection

## Current Status

**Phase 6a Complete** ✅ - Read-Only Pipeline Viewer is now complete:

- ✅ PipelineManager component with 2x2 grid layout
- ✅ Active transformers display with selection highlighting
- ✅ Available transformers list
- ✅ Syntax-highlighted JSON code blocks with proper scrolling
- ✅ Pipeline status display with execution time and transformer count
- ✅ Proper height constraints and overflow handling

**Phase 6b In Progress** 🔄 - Visualize Button & Controlled Execution:

- 🔄 **Next**: Add "Visualize" button to PipelineManager
- 🔄 **Next**: Implement controlled pipeline execution (no auto-run)
- 🔄 **Next**: Show complete pipeline input/output in code panels
- 🔄 **Next**: Proper state management for visualization lifecycle

**Key UI Improvements:**

- **Syntax Highlighting**: JSON code blocks now have proper syntax highlighting with colors
- **Proper Scrolling**: Code blocks scroll both horizontally and vertically when content overflows
- **Height Constraints**: Fixed 180px height for code panels with consistent behavior
- **Professional Appearance**: Clean, modern UI that looks like a proper development tool

**Ready for Phase 6b**: Visualize Button implementation - adding controlled pipeline execution with proper state management and user feedback.

**Future Phases Planned**: Interactive pipeline builder with drag-and-drop, transformer selection for detailed inspection, and advanced pipeline modification capabilities.

---

_Last updated: 2025-01-27 19:15 UTC_
