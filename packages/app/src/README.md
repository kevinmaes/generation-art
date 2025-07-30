# Source Code Architecture 🏗️

## Overview

This directory follows a **3-stage architecture** with clear security boundaries between CLI-only processing and client-side rendering.

## 🛡️ Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY BOUNDARIES                      │
├─────────────────────────────────────────────────────────────────┤
│  🖥️  STAGE 1: CLI-ONLY (LOCAL, PRIVATE)                        │
│  └─ Never leaves developer machine                              │
│                                                                 │
│  🎨  STAGE 2 & 3: CLIENT-SIDE (PUBLIC)                         │
│  └─ Loads pre-processed, PII-safe data                         │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure

```
src/
├── cli/                          # 🖥️ STAGE 1: CLI-only, local, private
│   ├── import/                   # Data import & PII masking
│   │   ├── build-gedcom.ts       # Main CLI script
│   │   ├── parseGedcom.ts        # Basic parsing
│   │   └── README.md             # CLI usage docs
│   └── metadata/                 # Metadata extraction
│       ├── extraction-config.ts
│       ├── transformation-pipeline.ts
│       └── README.md
├── client/                       # 🎨 STAGE 2 & 3: Client-side
│   ├── data-loading/             # STAGE 2: JSON loading & error handling
│   │   ├── hooks/
│   │   │   └── useGedcomData.ts
│   │   ├── types/
│   │   │   └── gedcom.ts
│   │   └── README.md
│   └── display/                  # STAGE 3: Canvas layout & rendering
│       ├── sketches/
│       │   └── FamilyTreeSketch.ts
│       ├── layout/
│       │   └── display-data.ts   # NEW: Canvas layout data
│       ├── components/
│       │   ├── ArtGenerator.tsx
│       │   └── FramedArtwork.tsx
│       └── README.md
├── shared/                       # 🔄 Shared utilities
│   ├── types/
│   ├── constants.ts
│   └── utils/
├── parsers/                      # GEDCOM parser implementations
├── facades/                      # Parser abstraction layer
├── services/                     # Application services
├── tasks/                        # Background tasks
├── assets/                       # Static assets
├── App.tsx                       # Main application component
├── main.tsx                      # Application entry point
└── README.md                     # This file
```

## 🚀 Three-Stage Data Flow

### **Stage 1: Data Import & PII Masking** 🖥️

**Location**: `cli/`  
**Purpose**: Process raw GEDCOM files locally and create PII-safe metadata

```bash
# Process GEDCOM files locally
pnpm build:gedcom

# Output: generated/parsed/*-augmented.json (git-ignored)
```

### **Stage 2: Data Loading & Error Handling** 🎨

**Location**: `client/data-loading/`  
**Purpose**: Load pre-processed JSON and handle errors gracefully

```typescript
// Load pre-processed, safe data
const { data, loading, error } = useGedcomData({
  jsonFile: 'generated/parsed/kennedy-augmented.json',
});
```

### **Stage 3: Display Data & Canvas Rendering** 🎨

**Location**: `client/display/`  
**Purpose**: Transform metadata into canvas-specific layout data

```typescript
// Transform metadata to canvas layout
const displayData = createDisplayData(augmentedIndividuals, width, height);
// Render with P5.js
const sketch = createWebSketch(displayData, width, height);
```

## 🔒 Security Boundaries

### **CLI Layer** (`cli/`)

- ✅ **Local-only processing** - Never runs in browser
- ✅ **PII handling** - Processes sensitive data safely
- ✅ **Git-ignored output** - Generated files never committed
- ✅ **No network transmission** - All processing local

### **Client Layer** (`client/`)

- ✅ **Pre-processed data only** - Never handles raw GEDCOM files
- ✅ **PII-safe metadata** - Only works with masked data
- ✅ **Public interface** - Safe for web deployment
- ✅ **Error handling** - Graceful fallbacks for missing data

### **Shared Layer** (`shared/`)

- ✅ **No PII** - Contains only safe types and utilities
- ✅ **Pure functions** - No side effects or external dependencies
- ✅ **Type safety** - Comprehensive TypeScript definitions
- ✅ **Cross-layer compatibility** - Used by both CLI and client

## 🎯 Key Benefits

### **For Developers:**

- ✅ **Clear separation** - Obvious which code runs where
- ✅ **Security boundaries** - No accidental PII exposure
- ✅ **Maintainable** - Each stage has clear responsibilities
- ✅ **Testable** - Can test each stage independently

### **For Security:**

- ✅ **PII isolation** - Raw data never leaves local machine
- ✅ **Git safety** - Generated files never committed
- ✅ **Client safety** - Only pre-processed data loaded
- ✅ **Clear boundaries** - Impossible to accidentally expose PII

## 📚 Documentation

- **[Data Flow Stages](../docs/data-flow-stages.md)** - Detailed 3-stage architecture
- **[Architecture](../docs/architecture.md)** - System architecture overview
- **[API Reference](../docs/api-reference.md)** - Comprehensive API documentation

## 🔧 Development

### **Adding New Features**

1. **Stage 1**: Add CLI processing in `cli/`
2. **Stage 2**: Add data loading in `client/data-loading/`
3. **Stage 3**: Add display logic in `client/display/`
4. **Shared**: Add types/utilities in `shared/`

### **Testing**

- **CLI tests**: Test PII processing and masking
- **Client tests**: Test data loading and rendering
- **Shared tests**: Test types and utilities
- **Integration tests**: Test full data flow

This architecture makes it **impossible** to accidentally expose PII while providing a **clear, maintainable** codebase! 🛡️
