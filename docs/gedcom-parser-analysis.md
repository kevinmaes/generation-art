# GEDCOM Parser Analysis

## Overview

This document analyzes available GEDCOM 5.5.1 parsers for our generative art project. We're looking for a parser that can efficiently convert GEDCOM files to JavaScript/TypeScript objects, with a focus on modern tooling support and maintainability.

## Quick Comparison Table

| Feature            | [gedcom-ts](#1-gedcom-ts) | [gedcom.json](#2-gedcomjson) | [gedcom](#3-gedcom) | [gedcom-d3](#4-gedcom-d3) |
| ------------------ | ------------------------- | ---------------------------- | ------------------- | ------------------------- |
| **Version**        | 1.1.1                     | 1.0.9                        | 3.0.4               | 2.0.7                     |
| **Last Updated**   | Jun 2023                  | Mar 2024                     | Feb 2025            | Dec 2022                  |
| **Maintainer**     | bertrandjnt               | jisco                        | tmcw                | gaijinbrandybuck          |
| **TypeScript**     | ✅                        | ❌                           | ❌                  | ❌                        |
| **AST**            | ✅                        | ❌                           | ❌                  | ❌                        |
| **Streaming**      | ❌                        | ❌                           | ✅                  | ❌                        |
| **Module System**  | ESM                       | CommonJS                     | ESM                 | CommonJS                  |
| **Test Coverage**  | 80%                       | Basic                        | Good                | Basic                     |
| **Dependencies**   | Minimal                   | Moderate                     | Minimal             | Heavy (D3)                |
| **Documentation**  | Basic                     | Good                         | Good                | Basic                     |
| **Error Handling** | Basic                     | Basic                        | Good                | Basic                     |
| **Visualization**  | Basic                     | Good                         | None                | D3-focused                |

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
- Testing Coverage
- Visualization Support

## Parser Comparison

### 1. gedcom-ts

**GitHub**: https://github.com/bertrandjnt/gedcom-ts
**Version**: 1.1.1
**Last Updated**: June 2023
**Maintainer**: bertrandjnt
**Testing**: ✅ Jest tests, 80% coverage
**Dependencies**: Minimal

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
- Good test coverage
- Minimal dependencies

#### Cons

- Newer project
- Limited documentation
- No streaming support
- Basic error handling

### 2. gedcom.json

**GitHub**: https://github.com/jisco/gedcom.json
**Version**: 1.0.9
**Last Updated**: March 2024
**Maintainer**: jisco
**Testing**: ⚠️ Basic tests
**Dependencies**: Moderate

#### Features

- ❌ No TypeScript support
- ❌ No AST
- ❌ No streaming
- ✅ Active maintenance
- ✅ Good documentation
- ⚠️ Basic error handling

#### Technical Details

- Module System: CommonJS
- Dependencies: Moderate
- Performance: Good
- Community: Active

#### Pros

- Very recent updates
- Good documentation
- JSON-focused output
- Active maintenance

#### Cons

- No TypeScript support
- No streaming
- Moderate dependencies
- Basic error handling

### 3. gedcom

**GitHub**: https://github.com/tmcw/gedcom
**Version**: 3.0.4
**Last Updated**: February 2025
**Maintainer**: tmcw
**Testing**: ✅ Good test coverage
**Dependencies**: Minimal

#### Features

- ❌ No TypeScript support
- ❌ No AST
- ✅ Streaming support
- ✅ Active maintenance
- ✅ Good documentation
- ✅ Good error handling

#### Technical Details

- Module System: ESM
- Dependencies: Minimal
- Performance: Excellent
- Community: Active

#### Pros

- Streaming support
- Excellent performance
- Good documentation
- Active maintenance
- Minimal dependencies

#### Cons

- No TypeScript support
- No AST
- Basic visualization support

### 4. gedcom-d3

**GitHub**: https://github.com/gaijinbrandybuck/gedcom-d3
**Version**: 2.0.7
**Last Updated**: December 2022
**Maintainer**: gaijinbrandybuck
**Testing**: ⚠️ Basic tests
**Dependencies**: Heavy (D3)

#### Features

- ❌ No TypeScript support
- ❌ No AST
- ❌ No streaming
- ⚠️ Basic maintenance
- ⚠️ Basic documentation
- ⚠️ Basic error handling

#### Technical Details

- Module System: CommonJS
- Dependencies: Heavy (D3)
- Performance: Good
- Community: Moderate

#### Pros

- D3 visualization integration
- Good for our art needs
- JSON output format
- Active community

#### Cons

- Heavy D3 dependency
- No TypeScript support
- No streaming
- Basic error handling

## Updated Recommendation

### Primary Choice: gedcom-ts

We recommend **gedcom-ts** as our primary choice for the following reasons:

1. **Technical Advantages**

   - TypeScript support
   - AST-based parsing
   - Modern ESM support
   - Active maintenance
   - Good test coverage
   - Minimal dependencies

2. **Implementation Benefits**
   - Clean, modern API
   - Type safety
   - Good for our TypeScript project
   - Easy to extend

### Fallback Options (in order):

1. **gedcom**

   - If we need streaming support
   - Good for large files
   - Excellent performance
   - Good documentation

2. **gedcom.json**

   - If we need JSON-focused output
   - Good for visualization
   - Recent updates
   - Active maintenance

3. **gedcom-d3**

   - If we need D3 integration
   - Good for visualization
   - JSON output format
   - Active community

## Next Steps

1. Set up initial project structure
2. Create parser wrapper
3. Implement basic file loading
4. Add error handling
5. Create TypeScript types for parsed data
6. Add performance monitoring
7. Implement comprehensive testing
