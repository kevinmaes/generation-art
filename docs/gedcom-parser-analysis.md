# GEDCOM Parser Analysis

## Overview

This document analyzes available GEDCOM 5.5.1 parsers for our generative art project. We're looking for a parser that can efficiently convert GEDCOM files to JavaScript/TypeScript objects, with a focus on modern tooling support and maintainability.

## Evaluation Criteria

- Module System (ESM vs CommonJS)
- TypeScript Support
- AST Implementation
- Streaming Support
- Performance
- Maintenance Status
- Documentation Quality
- Error Handling
- Validation Capabilities
- Community Activity

## Parser Comparison

### 1. gedcom-parse

**GitHub**: https://github.com/trepo/gedcom-parse

#### Features

- ✅ TypeScript support with full type definitions
- ✅ AST-based parsing
- ✅ Streaming support
- ✅ Active maintenance (2023)
- ✅ Good documentation
- ✅ Advanced error handling
- ✅ GEDCOM 5.5.1 validation

#### Technical Details

- Module System: CommonJS (can be used with ESM)
- Dependencies: Moderate
- Performance: Excellent (streaming support)
- Community: Active

#### Pros

- Modern tooling support
- Type safety
- Efficient large file handling
- Active maintenance
- Good documentation

#### Cons

- Requires CommonJS to ESM conversion
- Moderate dependency footprint

### 2. family-tree-parser

**GitHub**: https://github.com/trepo/family-tree-parser

#### Features

- ✅ TypeScript support
- ✅ AST-based parsing
- ✅ Streaming support
- ✅ Active maintenance
- ✅ Good documentation
- ✅ Visualization focus

#### Technical Details

- Module System: CommonJS
- Dependencies: Heavy
- Performance: Good
- Community: Moderate

#### Pros

- Similar features to gedcom-parse
- Visualization-oriented
- Active development

#### Cons

- Heavy dependency footprint
- Opinionated data structure
- Less focused on raw parsing

### 3. gedcom.js

**GitHub**: https://github.com/rootsdev/gedcom.js

#### Features

- ❌ No TypeScript support
- ❌ No AST
- ❌ No streaming
- ⚠️ Basic maintenance
- ⚠️ Basic documentation
- ⚠️ Basic error handling

#### Technical Details

- Module System: CommonJS only
- Dependencies: Minimal
- Performance: Basic
- Community: Low

#### Pros

- Simple implementation
- Lightweight
- Easy integration

#### Cons

- Outdated
- Limited features
- No type safety

### 4. gedcom-js

**GitHub**: https://github.com/trepo/gedcom-js

#### Features

- ✅ TypeScript support
- ❌ No AST
- ❌ No streaming
- ⚠️ Basic maintenance
- ⚠️ Basic documentation
- ⚠️ Basic error handling

#### Technical Details

- Module System: ESM
- Dependencies: Minimal
- Performance: Basic
- Community: Low

#### Pros

- Modern module system
- TypeScript support
- Simple implementation

#### Cons

- Limited features
- Less active development
- Basic error handling

## Recommendation

### Primary Choice: gedcom-parse

We recommend using **gedcom-parse** for our MVP for the following reasons:

1. **Technical Advantages**

   - Full TypeScript support
   - AST-based parsing for flexible data transformation
   - Streaming support for large files
   - Advanced error handling and validation

2. **Maintenance & Support**

   - Active development
   - Good documentation
   - Active community
   - Regular updates

3. **Implementation Benefits**
   - Type safety for our data enhancement adapters
   - Efficient handling of large files
   - Flexible data transformation through AST
   - Good error handling for malformed files

### Implementation Plan

1. Create a wrapper to handle CommonJS to ESM conversion
2. Implement TypeScript interfaces for our enhanced data
3. Create data enhancement adapters using the AST
4. Add streaming support for large files
5. Implement error handling and validation

### Fallback Option: family-tree-parser

If we encounter issues with gedcom-parse, family-tree-parser would be our fallback option due to its similar feature set and active maintenance.

## Next Steps

1. Set up initial project structure
2. Create parser wrapper
3. Implement basic file loading
4. Add error handling
5. Create TypeScript types for parsed data
