# generation-art 🎨

A web application that generates artistic visualizations from GEDCOM (Genealogical Data Communication) files, focusing on data enhancement and creative visualization rather than parsing. The project uses existing GEDCOM parsers and focuses on deriving meaningful numerical properties for generative art creation.

![Generated graph visualization](images/graph1.png)

## 🛠️ Technology Stack

- TypeScript
- Canvas API
- Existing GEDCOM parser
- Modern build tools (Vite/Webpack)
- Testing framework (Jest/Vitest)

## 📝 Technical Notes

- Use TypeScript for type safety and better development experience
- Consider using `gedcom.js` or similar library for parsing
- Focus on Canvas API for visualization
- Consider using Web Workers for data processing
- Implement proper error handling for malformed GEDCOM files

## 🔍 Research & Resources

- GEDCOM 5.5.1 specification (stored in docs/)
- Existing GEDCOM parser libraries:
  - gedcom.js
  - gedcom-parse
  - family-tree-parser
- Canvas API documentation
- TypeScript best practices
- Generative art algorithms and patterns
