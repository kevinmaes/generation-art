# CLI Processing Layer 🖥️

## Overview

This directory contains **CLI-only code** that processes raw GEDCOM files locally and generates PII-safe JSON output. This code **never runs in the browser** and handles all sensitive data processing.

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI-ONLY ZONE                            │
│                    (LOCAL, PRIVATE, SECURE)                     │
├─────────────────────────────────────────────────────────────────┤
│  📁 Raw GEDCOM files (contain PII)                             │
│  🖥️ CLI build process (local processing)                       │
│  🔒 PII masking (privacy protection)                           │
│  📈 Metadata extraction (PII-safe computed data)               │
│  💾 Generated JSON (git-ignored, local only)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
cli/
├── import/                   # Data import & PII masking
│   ├── build-gedcom.ts       # Main CLI script
│   ├── parseGedcom.ts        # Basic parsing
│   └── README.md             # CLI usage docs
└── metadata/                 # Metadata extraction
    ├── extraction-config.ts
    ├── transformation-pipeline.ts
    └── README.md
```

## Key Responsibilities

### **Data Import** (`import/`)

- **GEDCOM file processing** - Parse raw .ged files
- **PII masking** - Transform sensitive data for privacy
- **JSON generation** - Create safe output files
- **Error handling** - Validate input and handle errors

### **Metadata Extraction** (`metadata/`)

- **Metadata configuration** - Define extraction rules
- **Transformation pipeline** - Process data through stages
- **PII protection** - Ensure no sensitive data leaks
- **Data validation** - Verify output quality

## Usage

```bash
# Process all GEDCOM files
pnpm build:gedcom

# Process specific file
pnpm build:gedcom ./examples/kennedy/kennedy.ged
```

## Output

Generated files are saved to `generated/parsed/` (git-ignored) with the format:

- `_{filename}-raw.json` - Raw parsed GEDCOM data (intermediate file)
- `{filename}.json` - Enhanced data with metadata and relationships (main file)

## Development Workflow

### **Automatic File Copying**

The CLI outputs to the root `generated/` folder, but the React app needs files in `client/public/generated/` for Vite to serve them. This is handled automatically:

```bash
# Build GEDCOM files and copy to client/public
pnpm build:gedcom && pnpm copy-generated

# Or use the combined script
pnpm dev:with-gedcom

# Manual copy if needed
pnpm copy-generated
```

> **Security Note**: Both `generated/` and `client/public/generated/` are git-ignored to prevent PII data from being committed to version control.

### **Post-Build Script**

The `postbuild` script automatically copies generated files after any build process:

```bash
# This will run: build:gedcom → copy-generated → build
pnpm build
```

## Security Features

- ✅ **Local-only processing** - No network transmission
- ✅ **Git-ignored output** - Generated files never committed (both `generated/` and `client/public/generated/`)
- ✅ **PII masking** - Sensitive data transformed
- ✅ **CLI-only access** - No web interface to raw data

## Development Guidelines

1. **Never import browser APIs** - This code runs in Node.js only
2. **Always mask PII** - Transform sensitive data before output
3. **Validate inputs** - Check GEDCOM files for validity
4. **Handle errors gracefully** - Provide clear error messages
5. **Test thoroughly** - Ensure no PII leaks in output

## Integration

This layer feeds into the **Client Layer** (`../client/`) which loads the generated JSON files and renders them in the browser.
