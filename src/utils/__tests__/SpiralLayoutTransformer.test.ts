import { describe, it, expect } from 'vitest';
import { SpiralLayoutTransformer } from '../SpiralLayoutTransformer';
import type { AugmentedIndividual } from '../../components/types';

// Mock data for testing
const createMockIndividual = (
  id: string,
  name: string,
  generation: number = 0,
  parents: string[] = [],
  children: string[] = [],
  spouses: string[] = [],
  siblings: string[] = []
): AugmentedIndividual => ({
  id,
  name,
  generation,
  parents,
  children,
  spouses,
  siblings,
  birth: {},
  death: {},
  relativeGenerationValue: 100,
});

const mockFamilyData: AugmentedIndividual[] = [
  createMockIndividual('I1', 'John Smith', 0, [], ['I2', 'I3'], ['S1'], []),
  createMockIndividual('I2', 'Jane Smith', -1, ['I1'], [], [], ['I3']),
  createMockIndividual('I3', 'Bob Smith', -1, ['I1'], [], [], ['I2']),
  createMockIndividual('S1', 'Mary Smith', 0, [], ['I2', 'I3'], ['I1'], []),
  createMockIndividual('G1', 'Grandpa Smith', 1, [], ['I1'], [], []),
];

describe('SpiralLayoutTransformer', () => {
  const defaultConfig = {
    spiralType: 'archimedean' as const,
    layoutMode: 'primary-center' as const,
    spiralTightness: 1.0,
    nodeSpacing: 30,
    spacingGrowth: 'linear' as const,
    centerX: 500,
    centerY: 400,
    maxRadius: 300,
    primaryIndividualId: 'I1',
  };

  describe('Primary Center Layout', () => {
    it('should place primary individual at center', () => {
      const transformer = new SpiralLayoutTransformer(defaultConfig);
      const positions = transformer.transform(mockFamilyData);
      
      const centerPosition = positions.find(pos => pos.id === 'I1');
      expect(centerPosition).toBeDefined();
      expect(centerPosition!.x).toBe(defaultConfig.centerX);
      expect(centerPosition!.y).toBe(defaultConfig.centerY);
      expect(centerPosition!.distance).toBe(0);
    });

    it('should position connected individuals around center', () => {
      const transformer = new SpiralLayoutTransformer(defaultConfig);
      const positions = transformer.transform(mockFamilyData);
      
      const centerPosition = positions.find(pos => pos.id === 'I1')!;
      const connectedPositions = positions.filter(pos => 
        ['I2', 'I3', 'S1'].includes(pos.id)
      );
      
      connectedPositions.forEach(pos => {
        const distance = Math.sqrt(
          Math.pow(pos.x - centerPosition.x, 2) + 
          Math.pow(pos.y - centerPosition.y, 2)
        );
        expect(distance).toBeGreaterThan(0);
        expect(pos.distance).toBeGreaterThan(0);
      });
    });
  });

  describe('Oldest Center Layout', () => {
    it('should place oldest generation at center', () => {
      const config = {
        ...defaultConfig,
        layoutMode: 'oldest-center' as const,
        primaryIndividualId: undefined,
      };
      
      const transformer = new SpiralLayoutTransformer(config);
      const positions = transformer.transform(mockFamilyData);
      
      // G1 has generation = 1 (highest/oldest)
      const centerPosition = positions.find(pos => pos.id === 'G1');
      expect(centerPosition).toBeDefined();
      expect(centerPosition!.distance).toBe(0);
    });
  });

  describe('Youngest Center Layout', () => {
    it('should place youngest generation at center', () => {
      const config = {
        ...defaultConfig,
        layoutMode: 'youngest-center' as const,
        primaryIndividualId: undefined,
      };
      
      const transformer = new SpiralLayoutTransformer(config);
      const positions = transformer.transform(mockFamilyData);
      
      // I2 and I3 have generation = -1 (lowest/youngest), should pick first one found
      const centerPosition = positions.find(pos => pos.distance === 0);
      expect(centerPosition).toBeDefined();
      expect(['I2', 'I3'].includes(centerPosition!.id)).toBe(true);
    });
  });

  describe('Spiral Types', () => {
    it('should work with different spiral types', () => {
      const spiralTypes = ['archimedean', 'logarithmic', 'galaxy', 'fermat'] as const;
      
      spiralTypes.forEach(spiralType => {
        const config = { ...defaultConfig, spiralType };
        const transformer = new SpiralLayoutTransformer(config);
        const positions = transformer.transform(mockFamilyData);
        
        expect(positions).toHaveLength(mockFamilyData.length);
        
        // Check that positions are unique (no two individuals at exact same spot)
        const positionStrings = positions.map(pos => `${pos.x},${pos.y}`);
        const uniquePositions = new Set(positionStrings);
        expect(uniquePositions.size).toBe(positions.length);
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration correctly', () => {
      const transformer = new SpiralLayoutTransformer(defaultConfig);
      
      const newConfig = { spiralTightness: 2.0, nodeSpacing: 50 };
      transformer.updateConfig(newConfig);
      
      const updatedConfig = transformer.getConfig();
      expect(updatedConfig.spiralTightness).toBe(2.0);
      expect(updatedConfig.nodeSpacing).toBe(50);
    });
  });

  describe('Error Handling', () => {
    it('should throw error if primary individual not found', () => {
      const config = {
        ...defaultConfig,
        primaryIndividualId: 'NONEXISTENT',
      };
      
      const transformer = new SpiralLayoutTransformer(config);
      
      expect(() => {
        transformer.transform(mockFamilyData);
      }).toThrow('Primary individual with ID NONEXISTENT not found');
    });

    it('should handle empty family data', () => {
      const transformer = new SpiralLayoutTransformer(defaultConfig);
      const positions = transformer.transform([]);
      
      expect(positions).toHaveLength(0);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate correct relationship distances', () => {
      const transformer = new SpiralLayoutTransformer(defaultConfig);
      const positions = transformer.transform(mockFamilyData);
      
      // Direct connections should have distance 1
      const directConnections = positions.filter(pos => 
        ['I2', 'I3', 'S1'].includes(pos.id)
      );
      directConnections.forEach(pos => {
        expect(pos.distance).toBe(1);
      });
      
      // Grandparent should have higher distance
      const grandparent = positions.find(pos => pos.id === 'G1');
      expect(grandparent!.distance).toBeGreaterThan(1);
    });
  });
});