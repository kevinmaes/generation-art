# Spiral Layout Transformer Implementation

## Overview

This implementation resolves GitHub issue #138 by adding a comprehensive spiral layout system for positioning family tree individuals along various mathematical spiral curves.

## ✅ Completed Features

### 🌀 Spiral Algorithms

Four distinct spiral types have been implemented in `src/utils/SpiralAlgorithms.ts`:

1. **Archimedean Spiral** (`r = a + b * θ`)
   - Uniform spacing spiral with linear radius growth
   - Best for evenly distributed layouts

2. **Logarithmic Spiral** (`r = a * e^(b*θ)`)
   - Exponential growth spiral, resembles natural spirals
   - Good for organic, nature-inspired layouts

3. **Galaxy Spiral**
   - Multi-arm spiral resembling galaxy disk perspective
   - Creates multiple spiral arms emanating from center
   - Configurable number of arms (default: 3)

4. **Fermat's Spiral** (`r = ±√(a*θ)`)
   - Optimal packing spiral using golden angle
   - Efficient space utilization, dense packing

### 🎯 Layout Modes

Three layout modes implemented in `src/utils/SpiralLayoutTransformer.ts`:

1. **primary-center**: Selected individual at center, relations spiral outward
2. **oldest-center**: Oldest generation at center, descendants spiral outward  
3. **youngest-center**: Youngest generation at center, ancestors spiral outward

### ⚙️ Spacing Controls

Three spacing control parameters:

1. **spiralTightness** (0.1-2.0): Controls distance between spiral rings
2. **nodeSpacing** (10-100px): Sets distance between nodes along curve
3. **spacingGrowth**: Algorithm for spacing variation
   - `linear`: Even spacing throughout
   - `exponential`: Nodes spread out more towards edges
   - `logarithmic`: Nodes pack more densely towards edges

### 🎨 Integration

- **Updated helpers.ts**: Replaced hash-based positioning with spiral layout
- **Modified FamilyTreeSketch.ts**: Passes family data to coordinate function
- **Enhanced ArtGenerator.tsx**: Added spiral configuration support
- **Updated FramedArtwork.tsx**: Added spiral controls option
- **Modified App.tsx**: Enabled spiral controls by default

### 🎛️ User Interface

Created `src/components/SpiralControls.tsx` with:
- Spiral type selection dropdown
- Layout mode selection
- Primary individual selection (for primary-center mode)
- Interactive sliders for tightness and spacing
- Spacing growth algorithm selection
- Reset to defaults button
- Information panel explaining spiral types

### 🧪 Testing

Comprehensive test suites:
- `src/utils/__tests__/SpiralAlgorithms.test.ts`: Tests all spiral algorithms
- `src/utils/__tests__/SpiralLayoutTransformer.test.ts`: Tests layout modes and configuration

## 🚀 How to Use

1. **Default Usage**: The spiral layout is now enabled by default in the main app
2. **Interactive Controls**: Use the spiral controls panel to experiment with different configurations
3. **Programmatic Usage**: 
   ```typescript
   import { SpiralLayoutTransformer } from './utils/SpiralLayoutTransformer';
   
   const transformer = new SpiralLayoutTransformer({
     spiralType: 'archimedean',
     layoutMode: 'primary-center',
     spiralTightness: 1.0,
     nodeSpacing: 30,
     spacingGrowth: 'linear',
     centerX: 500,
     centerY: 400,
     maxRadius: 300,
     primaryIndividualId: 'I123'
   });
   
   const positions = transformer.transform(familyData);
   ```

## 📊 Technical Details

### Architecture

- **SpiralAlgorithms.ts**: Pure mathematical functions for spiral calculations
- **SpiralLayoutTransformer.ts**: Main class that handles family tree logic and positioning
- **helpers.ts**: Integration layer that maintains backward compatibility
- **SpiralControls.tsx**: React component for user interface

### Performance

- Position caching to avoid recalculation on every render
- Efficient family tree traversal using BFS algorithm
- Lazy recalculation only when data or configuration changes

### Backward Compatibility

- Falls back to original hash-based positioning when no family data available
- Maintains existing API for `getIndividualCoord` function
- No breaking changes to existing components

## 🔧 Configuration Options

The spiral layout is highly configurable:

```typescript
interface SpiralLayoutConfig {
  spiralType: 'archimedean' | 'logarithmic' | 'galaxy' | 'fermat';
  layoutMode: 'primary-center' | 'oldest-center' | 'youngest-center';
  spiralTightness: number;  // 0.1-2.0
  nodeSpacing: number;      // 10-100px
  spacingGrowth: 'linear' | 'exponential' | 'logarithmic';
  centerX: number;
  centerY: number;
  maxRadius: number;
  primaryIndividualId?: string;
}
```

## 🎉 Results

The implementation successfully creates visually appealing spiral layouts that:
- Maintain family relationships through connected lines
- Provide multiple aesthetic options through different spiral types
- Allow flexible centering based on genealogical priorities
- Offer fine-grained control over spacing and density
- Scale appropriately to canvas dimensions
- Provide interactive real-time configuration

## 🔄 Git Information

- **Branch**: `spiral-layout-transformer`
- **Commit**: `c21d223` - "Implement spiral layout transformer with various spiral types and layout modes"
- **Files Modified**: 11 files (6 new, 5 modified)
- **Tests**: All tests passing ✅
- **Type Check**: No TypeScript errors ✅

## 🚀 Next Steps

The feature is ready for:
1. Code review
2. Pull request creation
3. Integration testing with real family data
4. User feedback and refinement

This implementation fully satisfies the requirements of GitHub issue #138 and provides a solid foundation for future enhancements.