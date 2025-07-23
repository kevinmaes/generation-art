# 🧠 Cursor Feature Prompt

## 1. The Problem

We are building the core feature of our generative art application: a **VisualTransformer pipeline**. This pipeline will convert privacy-safe, GEDCOM-derived metadata (for individuals, families, and the tree) into **visual attributes** suitable for rendering to a canvas. These attributes include layout positions, scale, colors, lines, and shapes.

We need help from Cursor to **implement this feature in modular, reviewable stages**, using atomic commits, and building from a shared understanding of the architecture and feature goals.

## 2. Supporting Information

### 🔧 VisualTransformer Concept

Each **VisualTransformer** is a function that:

- Accepts two arguments:
  - **`metadata`** – parsed, privacy-safe metadata from GEDCOM (individuals, families, tree-wide signals)
  - **`visualMetadata`** – the current set of visual attribute values (e.g. x/y, color, shape, etc.)
- Produces a **transformed visualMetadata** based on:
  - Its own creative logic
  - An optional “temperature” value to control randomness
- Can be **chained** with other transformers
- Should be **agnostic to order**, but still capable of interpreting and adjusting previous transformations

### 🔁 Pipeline

- Transformers can be dragged/dropped into a pipeline in the UI
- Their order can be swapped
- A special **initializer transformer** will likely be required to create the first visualMetadata object
- Each transformer should:
  - Handle default values gracefully
  - Apply transformation logic even if input is already partially transformed

### 🎛 UI Interaction

- The user can browse available transformers
- Drag and drop them to reorder in a pipeline UI
- Press “Generate Art” to run the pipeline, producing visual metadata
- A renderer will then take the final visual metadata and display the artwork

### ✨ Design Philosophy

- Strive for balance between **determinism and randomness** via a `temperature` param
- Encourage reuse of transformer components
- Allow new transformers to be added over time without changing the core logic
- The art should always feel **unique**, but **recognizably seeded by the GEDCOM data**

## 3. Steps to Completion

> Cursor, please help implement this feature incrementally. Break each phase into logical commits and use this prompt as a north star for planning.

### ✅ Phase 1: Core VisualTransformer Logic

- [ ] Define types/interfaces for `metadata`, `visualMetadata`, and `VisualTransformerFn`
- [ ] Create a `createTransformer` factory to help define transformers with config like `name`, `temperature`, `apply`
- [ ] Create sample transformer: `horizontalSpreadByGeneration`

### ✅ Phase 2: Chaining and Execution

- [ ] Implement a `runPipeline()` function to apply transformers in sequence
- [ ] Ensure transformers are order-agnostic but state-sensitive
- [ ] Handle initialization transformer (e.g., default layout generator)

### ✅ Phase 3: Randomness and Repeatability

- [ ] Add seeded pseudo-random generator to ensure repeatability
- [ ] Support adjustable `temperature` for variance
- [ ] Define a strategy for resetting seed per run

### ✅ Phase 4: UI (Optional for now)

- [ ] Create a registry of available transformers
- [ ] Design a drag-and-drop interface
- [ ] Build “Generate Art” button to run pipeline + render output

---

_Last updated: 2025-07-23_
