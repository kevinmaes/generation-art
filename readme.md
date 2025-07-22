# generation-art 🎨

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5_Canvas-000000?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![p5.js](https://img.shields.io/badge/p5.js-ED225D?style=for-the-badge&logo=p5.js&logoColor=white)](https://p5js.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![GEDCOM](https://img.shields.io/badge/GEDCOM-5.5.1-2C3E50?style=for-the-badge)](https://www.familysearch.org/en/developers/docs/gedcom/)

Generation Art is a web application and set of developer tools to generate abstract artistic visualizations from GEDCOM (Genealogical Data Communication) files.

![Generated graph visualization](images/graph1.png)

## 📚 About GEDCOM

GEDCOM (Genealogical Data Communication) is a standard file format for genealogical data. It's used to exchange genealogical data between different genealogy software. This project aims to be compatible with [GEDCOM version 5.5.1](documents/gedcom-5.5.1.pdf), created by [Family Search](http://familysearch.org/). This document's original source is available, along with other official specifications, on the [Family Search site](https://www.familysearch.org/en/developers/docs/gedcom/).

## 📚 Documentation

- **[Full Documentation](docs/README.md)** - Complete project documentation and navigation
- **[Architecture](docs/architecture.md)** - System design and component architecture
- **[API Reference](docs/api-reference.md)** - Comprehensive developer reference
- **[Data Flow](docs/data-flow-stages.md)** - How data moves through the system
- **[Types](docs/types.md)** - TypeScript type definitions and GEDCOM mappings
- **[GEDCOM Integration](docs/gedcom-ts-integration.md)** - Parser implementation details

## 🛠️ Technology Stack

- TypeScript
- React + Vite
- Tailwind CSS
- Canvas API
- Custom GEDCOM parser (SimpleGedcomParser)
- Modern build tools (Vite)
- Testing framework (Vitest)

## 📝 Technical Notes

- Use TypeScript for type safety and better development experience
- Using `gedcom-ts` for GEDCOM parsing
- Focus on Canvas API for visualization
- Consider using Web Workers for data processing
- Implement proper error handling for malformed GEDCOM files

## 🔍 Research & Resources

- Existing GEDCOM parser libraries:
  - gedcom-ts
  - gedcom-parse
  - family-tree-parser
- Canvas API documentation
- TypeScript best practices
- Generative art algorithms and patterns

## 🚀 Development Setup

This project uses Vite for fast development and building. To get started:

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```

The project uses ESLint for code quality. The configuration includes type-aware rules and React-specific linting.
