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

## 3. Steps to Completion

> Cursor, please help implement this feature incrementally. Break each phase into logical commits and use this prompt as a north star for planning.

### ✅ Phase 1: Core VisualTransformer Logic

- [ ] Define TypeScript types/interfaces for:
  - `metadata`
  - `visualMetadata`
  - `VisualTransformerFn`
- [ ] Create a `createTransformer()` utility/factory
- [ ] Build example transformer: `horizontalSpreadByGeneration`

### ✅ Phase 2: Chaining and Execution

- [ ] Implement `runPipeline()` to chain transformers
- [ ] Create `createInitialVisualMetadata()` bootstrapper
- [ ] Ensure all transformers can handle partial or pre-transformed input

### ✅ Phase 3: Randomness and Repeatability

- [ ] Integrate seeded pseudo-random generator
- [ ] Respect `temperature` parameter for all non-deterministic logic
- [ ] Ensure pipeline produces repeatable results when seeded

### ✅ Phase 4: Optional LLM Delegation

- [ ] Add optional LLM-driven transformers
- [ ] Design a privacy-safe abstraction layer to summarize metadata before sending
- [ ] Create first LLM transformer (e.g., layout metaphor selector)

### ✅ Phase 5: UI (Optional for now)

- [ ] Create a transformer registry
- [ ] Build drag-and-drop interface with reorderable pipeline
- [ ] Connect pipeline to canvas renderer with "Generate Art" action

---

_Last updated: 2025-07-27_
