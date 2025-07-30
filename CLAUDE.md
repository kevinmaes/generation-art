# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `pnpm dev` - Start Vite development server
- `pnpm dev:full` - Build example data + start dev server
- `pnpm dev:with-gedcom` - Build GEDCOM data + start dev server

### GEDCOM Processing

- `pnpm build:gedcom <file>` - Process a GEDCOM file through the CLI pipeline
- `pnpm build:gedcom:example` - Process the example Kennedy GEDCOM file

### Testing

- `pnpm test` - Run all tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Generate coverage report
- Run a single test file: `pnpm test path/to/test.spec.ts`

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Check TypeScript types
- `pnpm checks` - Run all checks (lint + typecheck + format)

### Build

- `pnpm build` - Production build (runs typecheck + vite build)

## Architecture

This is a privacy-focused generative art application that transforms GEDCOM (genealogy) files into artwork using a 3-stage pipeline:

### Stage 1: CLI Processing (Local Only)

- **Location**: `/cli/`
- **Purpose**: Parse GEDCOM files locally, extract metadata, strip PII
- **Key Files**:
  - `cli/import/gedcom-to-json.ts` - Main import script
  - `cli/metadata/metadata-extractor.ts` - Extracts visualization metadata
  - `cli/parsers/` - GEDCOM parsing implementations
- **Output**: Dual JSON structure (full data + LLM-ready data) in `/generated/`

### Stage 2: Data Loading (Client-Side)

- **Location**: `/client/src/data-loading/`
- **Purpose**: Load and validate pre-processed JSON data
- **Key Files**:
  - `useGedcomData.tsx` - Hook for loading GEDCOM data
  - `useGedcomList.tsx` - Hook for listing available GEDCOM files

### Stage 3: Visualization (Client-Side)

- **Location**: `/client/src/display/`
- **Purpose**: Transform data through visual pipelines and render with P5.js
- **Key Components**:
  - `P5Canvas.tsx` - Main canvas component
  - `transformers/` - Visual transformation pipelines
  - `services/canvas-export.ts` - High-resolution export functionality

### Key Architectural Decisions

1. **Privacy First**: PII never leaves the developer's machine. All sensitive data is processed locally in Stage 1.
2. **Dual Data Structure**: Separates full genealogy data from LLM-ready sanitized data.
3. **Pipeline Architecture**: Visual transformers can be chained to create complex artwork from simple data.
4. **TypeScript Everywhere**: Strong typing across CLI, shared types, and client code.

### Project Structure

- `/cli/` - Command-line tools for GEDCOM processing
- `/client/` - React application for visualization
- `/shared/` - Shared TypeScript types and utilities
- `/examples/` - Example GEDCOM files for testing
- `/generated/` - CLI output directory (git-ignored)

### Technology Stack

- **Frontend**: React 19, TypeScript 5.8, Vite
- **Visualization**: P5.js for canvas rendering
- **Styling**: Tailwind CSS
- **Data Processing**: gedcom-ts + custom parsers
- **Testing**: Vitest
- **Package Manager**: pnpm

## Privacy Instructions

### Directories to Avoid

To protect personally identifiable information (PII), Claude should **NEVER** read files from these directories:

- `/generated/` - Contains processed GEDCOM data with full PII
- `/client/public/generated/` - Contains processed GEDCOM data with full PII
- Any `.gedcom` or `.ged` files anywhere in the repository

### Safe Directories

These directories contain only code and sanitized data:

- `/cli/` - Processing scripts (safe)
- `/client/` - Frontend code (safe, except `/client/public/generated/` which contains PII)
- `/shared/` - Type definitions (safe)
- `/docs/` - Documentation (safe)

When working with this codebase, always be mindful that this is a privacy-focused application. Never attempt to read or display the contents of GEDCOM files or generated JSON data that may contain personal information.
