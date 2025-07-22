# Shared Utilities Layer 🔄

## Overview

This directory contains **shared code** used by both the CLI and client layers. This code contains **no PII** and only includes safe types, constants, and utility functions.

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                      SHARED ZONE                                │
│                    (SAFE, NO PII)                              │
├─────────────────────────────────────────────────────────────────┤
│  📝 Type definitions (safe interfaces)                         │
│  🔧 Utility functions (pure functions)                         │
│  📊 Constants (configuration values)                           │
│  🧪 Test utilities (shared testing code)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
shared/
├── types/                     # TypeScript type definitions
│   ├── index.ts              # Main type exports
│   ├── gedcom.ts             # GEDCOM-related types
│   ├── metadata.ts           # Metadata types
│   └── type-predicates.ts    # Type checking functions
├── utils/                     # Utility functions
│   ├── index.ts              # Main utility exports
│   └── CanvasFactory.ts      # Canvas management utilities
├── constants.ts               # Application constants
└── README.md                  # This file
```

## Key Responsibilities

### **Types** (`types/`)

- **Type definitions** - Shared interfaces and types
- **Type predicates** - Runtime type checking functions
- **GEDCOM mappings** - Type-safe GEDCOM property mappings
- **Metadata interfaces** - PII-safe metadata structures

### **Utilities** (`utils/`)

- **Pure functions** - Stateless utility functions
- **Canvas utilities** - Browser-safe canvas operations
- **Data validation** - Type-safe validation functions
- **Helper functions** - Common operations used across layers

### **Constants** (`constants.ts`)

- **Canvas dimensions** - Web and print dimensions
- **Export settings** - Print and export configuration
- **Application config** - Shared configuration values

## Usage

```typescript
// Import types
import type { AugmentedIndividual, IndividualMetadata } from '../shared/types';

// Import utilities
import { CanvasFactory } from '../shared/utils';

// Import constants
import { CANVAS_DIMENSIONS } from '../shared/constants';
```

## Security Features

- ✅ **No PII** - Contains only safe, non-sensitive data
- ✅ **Pure functions** - No side effects or external dependencies
- ✅ **Type safety** - Comprehensive TypeScript definitions
- ✅ **Shared validation** - Consistent validation across layers

## Development Guidelines

1. **Keep it pure** - No side effects or external dependencies
2. **No PII** - Never include sensitive data or raw GEDCOM content
3. **Type safety** - Use strict TypeScript with comprehensive types
4. **Test thoroughly** - All shared code should be well-tested
5. **Document clearly** - Clear documentation for all exports

## Integration

This layer is used by both:

- **CLI Layer** (`../cli/`) - For type definitions and utilities
- **Client Layer** (`../client/`) - For types, utilities, and constants
