# generation-art 🎨

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5_Canvas-000000?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![p5.js](https://img.shields.io/badge/p5.js-ED225D?style=for-the-badge&logo=p5.js&logoColor=white)](https://p5js.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![GEDCOM](https://img.shields.io/badge/GEDCOM-5.5.1-2C3E50?style=for-the-badge)](https://www.familysearch.org/en/developers/docs/gedcom/)

Transform GEDCOM family tree data into generative artwork using React, TypeScript, and P5.js.

![Generated family tree visualization](images/graph1.png)

## 🚀 Quick Start

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Process a GEDCOM file**

   ```bash
   pnpm build:gedcom examples/kennedy/kennedy.ged
   ```

3. **Start the app**
   ```bash
   pnpm dev
   ```

## 📚 Documentation

- **[Full Documentation](docs/README.md)** - Complete project docs
- **[Data Flow](docs/data-flow.md)** - 3-stage pipeline & security
- **[Types](docs/types.md)** - TypeScript types & GEDCOM mappings
- **[API](docs/api.md)** - Complex function documentation
- **[Examples](docs/examples/)** - Code examples & usage

## 🔒 Security Model

- **Stage 1**: CLI-only processing with PII masking
- **Stage 2-3**: Client-side visualization of safe data only
- **No raw GEDCOM data** ever leaves your machine

## 🎯 Key Features

- ✅ **GEDCOM 5.5.1 parsing** with custom lightweight parser
- ✅ **PII-safe metadata extraction** for privacy protection
- ✅ **Real-time canvas rendering** with P5.js
- ✅ **High-resolution exports** (PNG, print-ready)
- ✅ **Type-safe** full TypeScript implementation
