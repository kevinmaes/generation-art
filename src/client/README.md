# Client Application Layer 🎨

## Overview

This directory contains **client-side code** that runs in the browser and provides the user interface for viewing generated artwork. This code only loads **pre-processed, PII-safe data** and never handles raw GEDCOM files.

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT-SIDE ZONE                           │
│                    (PUBLIC, SAFE DATA)                          │
├─────────────────────────────────────────────────────────────────┤
│  💾 Pre-processed JSON (PII masked)                            │
│  🎨 React app (public interface)                               │
│  📊 Data loading & validation                                  │
│  🎯 Display data transformation                                │
│  🖼️ Canvas rendering (final artwork)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
client/
├── data-loading/             # STAGE 2: JSON loading & error handling
│   ├── hooks/
│   │   └── useGedcomData.ts
│   ├── types/
│   │   └── gedcom.ts
│   └── README.md
└── display/                  # STAGE 3: Canvas layout & rendering
    ├── sketches/
    │   └── FamilyTreeSketch.ts
    ├── layout/
    │   └── display-data.ts   # NEW: Canvas layout data
    ├── components/
    │   ├── ArtGenerator.tsx
    │   └── FramedArtwork.tsx
    └── README.md
```

## Key Responsibilities

### **Data Loading** (`data-loading/`)

- **JSON file loading** - Fetch pre-processed data from `generated/` directory
- **Error handling** - Graceful fallbacks for missing/corrupt files
- **Data validation** - Ensure JSON structure is correct
- **Loading states** - User feedback during data loading

### **Display** (`display/`)

- **Canvas rendering** - P5.js-based visualizations
- **Layout calculations** - Position nodes and edges
- **Animation data** - Prepare data for visual effects
- **User interface** - React components for interaction

## Data Flow

```
1. Load JSON → 2. Validate Data → 3. Transform to Display → 4. Render Canvas
```

## Usage

```typescript
// Load pre-processed, safe data
const { data, loading, error } = useGedcomData({
  jsonFile: 'generated/parsed/kennedy-augmented.json',
});

// Transform metadata to canvas layout
const displayData = createDisplayData(data, width, height);

// Render with P5.js
const sketch = createWebSketch(displayData, width, height);
```

## Security Features

- ✅ **Pre-processed data** - Only safe, masked data loaded
- ✅ **No raw GEDCOM access** - Can't access original files
- ✅ **Metadata only** - PII-safe computed values
- ✅ **Public interface** - Safe for web deployment

## Development Guidelines

1. **Never handle raw GEDCOM files** - Only load processed JSON
2. **Validate all inputs** - Check data structure before use
3. **Handle errors gracefully** - Provide user-friendly error messages
4. **Optimize for performance** - Large datasets need efficient rendering
5. **Test thoroughly** - Ensure UI works with various data scenarios

## Integration

This layer receives data from the **CLI Layer** (`../cli/`) and uses utilities from the **Shared Layer** (`../shared/`).
