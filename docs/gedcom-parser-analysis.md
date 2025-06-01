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

### 5. @gedcom/parser

**GitHub**: https://github.com/gedcom/parser

#### Features

- ✅ TypeScript support
- ✅ AST-based parsing
- ✅ Streaming support
- ✅ Active maintenance
- ✅ Good documentation
- ✅ Advanced error handling
- ✅ GEDCOM 5.5.1 validation

#### Technical Details

- Module System: ESM
- Dependencies: Minimal
- Performance: Excellent
- Community: Active

#### Pros

- Official GEDCOM organization project
- Modern tooling support
- Type safety
- Efficient large file handling
- Active maintenance
- Good documentation

#### Cons

- Newer project, less battle-tested
- Smaller community
- Fewer examples available

### 6. gedcom-ts

**GitHub**: https://github.com/gedcom/gedcom-ts

#### Features

- ✅ TypeScript support
- ✅ AST-based parsing
- ❌ No streaming
- ✅ Active maintenance
- ⚠️ Basic documentation
- ⚠️ Basic error handling

#### Technical Details

- Module System: ESM
- Dependencies: Minimal
- Performance: Good
- Community: Growing

#### Pros

- Modern TypeScript-first approach
- Clean API design
- Active development
- Part of GEDCOM organization

#### Cons

- Newer project
- Limited documentation
- No streaming support

## Updated Recommendation

### Primary Choice: @gedcom/parser

We now recommend **@gedcom/parser** as our primary choice for the following reasons:

1. **Technical Advantages**

   - Official GEDCOM organization project
   - Full TypeScript support
   - AST-based parsing
   - Streaming support
   - Modern ESM support
   - Active maintenance

2. **Implementation Benefits**
   - Clean, modern API
   - Type safety
   - Efficient file handling
   - Good error handling
   - Part of official GEDCOM tooling

### Fallback Options (in order):

1. **gedcom-ts**

   - If we need a simpler, TypeScript-first approach
   - Good for smaller files
   - Clean API design

2. **gedcom-js**

   - If we need the simplest possible implementation
   - Good for MVP with small files
   - Easy to replace later

3. **gedcom-parse**
   - If we need more battle-tested solution
   - Good for larger files
   - More complex but feature-rich

## Next Steps

1. Set up initial project structure
2. Create parser wrapper
3. Implement basic file loading
4. Add error handling
5. Create TypeScript types for parsed data
