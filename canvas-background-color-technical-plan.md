# Canvas Background Color Feature - Technical Implementation Plan

## Overview
This plan outlines the implementation of a user-selectable canvas background color feature for the generation-art project. The feature will allow users to customize the canvas background color through intuitive UI controls while maintaining the current architecture and performance.

## Current Architecture Analysis

### Existing Canvas Rendering Flow
1. **FramedArtwork.tsx** - Main wrapper component with header, canvas area, and footer
2. **ArtGenerator.tsx** - Manages p5.js instance lifecycle and data loading  
3. **FamilyTreeSketch.ts** - Contains p5.js sketch logic with hardcoded white background (`p.background(255)`)

### Current Background Implementation
- Background color is hardcoded as `p.background(255)` (white) in both `setup()` and `draw()` functions
- Applied in both web and print sketches
- No user customization currently available

## Technical Implementation Plan

### 1. State Management Architecture

#### New State Structure
```typescript
interface BackgroundColorState {
  color: string;           // Hex color value (e.g., "#ffffff")
  presets: string[];       // Predefined color options
}
```

#### State Management Approach
- **Local State**: Use React's `useState` at the `FramedArtwork` component level
- **Persistence**: Store user preference in `localStorage`
- **Default Value**: White (`#ffffff`) to maintain current behavior

### 2. Component Architecture Changes

#### A. New Components

**BackgroundColorPicker.tsx**
```typescript
interface BackgroundColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  presets?: string[];
}
```
- Color input field for custom hex values
- Quick preset buttons for common colors
- Visual color preview
- Validation for hex color format

#### B. Modified Components

**FramedArtwork.tsx**
- Add background color state management
- Pass background color to ArtGenerator
- Handle localStorage persistence

**ArtGenerator.tsx**  
- Accept background color as prop
- Pass to sketch creation functions

**FamilyTreeSketch.ts**
- Update `SketchConfig` interface to include `backgroundColor`
- Modify `createSketch` to use configurable background
- Apply background color in both `setup()` and `draw()`

### 3. UI Integration Plan

#### Placement Options Analysis

**Option A: Header Integration (Recommended)**
- Add color picker to the header area alongside title/subtitle
- Maintains clean separation from canvas and controls
- Always visible and accessible

**Option B: Footer Integration**
- Add to existing footer with export buttons
- Groups all canvas-related controls together
- May feel cluttered with existing buttons

**Option C: Separate Settings Panel**
- Create dedicated settings/customization panel
- Expandable/collapsible design
- Future-proof for additional settings

**Recommendation: Option A** - Header integration provides the best UX balance.

#### UI Layout Design
```
[Generation Art Title]     [🎨 Background: ⬜ ▼] [Preset Colors: ⬜ ⬛ 🔘 🔘 🔘]
[Subtitle text]
```

### 4. Implementation Steps

#### Phase 1: Core Functionality
1. **Update SketchConfig Interface**
   ```typescript
   export interface SketchConfig {
     // ... existing properties
     backgroundColor?: string;
   }
   ```

2. **Modify Sketch Creation**
   ```typescript
   function createSketch(options: SketchOptions): (p: p5) => void {
     const { backgroundColor = '#ffffff' } = config;
     
     return (p: p5) => {
       p.setup = () => {
         p.createCanvas(width, height, p.P2D);
         p.background(backgroundColor);
       };
       
       p.draw = () => {
         p.background(backgroundColor);
         // ... rest of drawing logic
       };
     };
   }
   ```

3. **Add State to FramedArtwork**
   ```typescript
   const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
   
   useEffect(() => {
     // Load from localStorage on mount
     const saved = localStorage.getItem('canvas-background-color');
     if (saved) setBackgroundColor(saved);
   }, []);
   
   useEffect(() => {
     // Save to localStorage on change
     localStorage.setItem('canvas-background-color', backgroundColor);
   }, [backgroundColor]);
   ```

#### Phase 2: UI Components
1. **Create BackgroundColorPicker Component**
   - Color input with live preview
   - Preset color buttons
   - Proper validation and error handling

2. **Integrate into Header**
   - Update FramedArtwork header JSX
   - Ensure responsive design
   - Maintain visual hierarchy

#### Phase 3: Enhancement & Polish
1. **Add Color Presets**
   ```typescript
   const COLOR_PRESETS = [
     '#ffffff', // White
     '#000000', // Black  
     '#f5f5f5', // Light Gray
     '#e5e5e5', // Medium Gray
     '#2c3e50', // Dark Blue Gray
     '#ecf0f1', // Light Blue Gray
   ];
   ```

2. **Accessibility Improvements**
   - ARIA labels for color controls
   - Keyboard navigation support
   - High contrast indicators
   - Screen reader compatibility

3. **Performance Optimization**
   - Debounce color changes to prevent excessive re-renders
   - Memoize sketch creation when only background changes

### 5. File Structure Changes

```
src/
├── components/
│   ├── BackgroundColorPicker.tsx      # New
│   ├── FramedArtwork.tsx             # Modified
│   ├── ArtGenerator.tsx              # Modified
│   └── ...
├── sketches/
│   └── FamilyTreeSketch.ts           # Modified
├── hooks/
│   └── useBackgroundColor.ts         # New (optional)
├── constants.ts                      # Modified (add color presets)
└── ...
```

### 6. Testing Strategy

#### Unit Tests
- BackgroundColorPicker component behavior
- Color validation functions
- localStorage persistence
- State management logic

#### Integration Tests  
- End-to-end color selection flow
- Canvas background updates correctly
- Export functionality with custom backgrounds
- Persistence across page reloads

#### Visual Testing
- Color accuracy verification
- UI layout at different screen sizes
- Color contrast accessibility

### 7. Edge Cases & Considerations

#### Color Validation
- Handle invalid hex codes gracefully
- Provide visual feedback for invalid inputs
- Fall back to default color on errors

#### Performance
- Debounce color picker changes (300ms)
- Avoid unnecessary p5.js canvas re-creation
- Efficient color conversion (hex to p5 color)

#### Accessibility
- Ensure color picker works with screen readers
- Provide keyboard navigation
- Maintain sufficient contrast ratios
- Include color name labels for presets

#### Cross-browser Compatibility
- Test color input support across browsers
- Provide fallback for browsers without native color picker
- Ensure localStorage compatibility

### 8. Future Enhancements

#### Advanced Color Features
- Color themes/palettes
- Background gradients
- Image backgrounds
- Color harmony suggestions

#### Additional Customization
- Node colors coordination with background
- Automatic contrast adjustment for text
- Export background color with canvas

## Implementation Timeline

- **Week 1**: Core sketch and state management changes
- **Week 2**: UI component development and integration  
- **Week 3**: Testing, accessibility, and polish
- **Week 4**: Documentation and final review

## Dependencies

### New Dependencies (Optional)
- `react-colorful` or `react-color` - For advanced color picker UI
- `chroma-js` - For color manipulation and validation

### Alternative: Native Implementation
- Use native HTML5 color input
- Custom validation with regex
- No additional dependencies required

## Success Criteria

1. ✅ Users can select any background color via color picker
2. ✅ Quick preset buttons work for common colors
3. ✅ Background color persists across sessions
4. ✅ Export functionality includes selected background
5. ✅ UI remains clean and intuitive
6. ✅ Performance impact is minimal
7. ✅ Feature works across all supported browsers
8. ✅ Accessibility standards are met

This implementation plan provides a comprehensive roadmap for adding canvas background color customization while maintaining the existing architecture and ensuring a high-quality user experience.