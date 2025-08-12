import { describe, expect, it } from 'vitest';
import { getIndividualCoord, getUniqueEdges } from './helpers';

describe('Helper Functions', () => {
  describe('getIndividualCoord', () => {
    it('should return coordinates within canvas bounds', () => {
      const coord = getIndividualCoord('test-id', 1000, 800);

      expect(coord.x).toBeGreaterThanOrEqual(0);
      expect(coord.x).toBeLessThanOrEqual(1000);
      expect(coord.y).toBeGreaterThanOrEqual(0);
      expect(coord.y).toBeLessThanOrEqual(800);
    });

    it('should return consistent coordinates for same ID', () => {
      const coord1 = getIndividualCoord('test-id', 1000, 800);
      const coord2 = getIndividualCoord('test-id', 1000, 800);

      expect(coord1).toEqual(coord2);
    });

    it('should handle different canvas sizes', () => {
      const coord = getIndividualCoord('test-id', 500, 400);

      expect(coord.x).toBeGreaterThanOrEqual(0);
      expect(coord.x).toBeLessThanOrEqual(500);
      expect(coord.y).toBeGreaterThanOrEqual(0);
      expect(coord.y).toBeLessThanOrEqual(400);
    });

    it('should return different coordinates for different IDs', () => {
      const coord1 = getIndividualCoord('id-1', 1000, 800);
      const coord2 = getIndividualCoord('id-2', 1000, 800);

      expect(coord1).not.toEqual(coord2);
    });
  });

  describe('getUniqueEdges', () => {
    it('should return unique edges from family data', () => {
      const mockDataArray = [
        {
          id: '1',
          name: 'Person 1',
          parents: ['2', '3'],
          spouses: [],
          children: [],
          siblings: [],
          birth: { date: '', place: '' },
          death: { date: '', place: '' },
          metadata: {},
        },
        {
          id: '2',
          name: 'Person 2',
          parents: ['4', '5'],
          spouses: [],
          children: [],
          siblings: [],
          birth: { date: '', place: '' },
          death: { date: '', place: '' },
          metadata: {},
        },
        {
          id: '3',
          name: 'Person 3',
          parents: ['6', '7'],
          spouses: [],
          children: [],
          siblings: [],
          birth: { date: '', place: '' },
          death: { date: '', place: '' },
          metadata: {},
        },
      ];

      // Convert array to Record as expected by getUniqueEdges
      const mockData = Object.fromEntries(
        mockDataArray.map((individual) => [individual.id, individual]),
      );

      const edges = getUniqueEdges(mockData);

      expect(edges).toHaveLength(6); // 3 individuals × 2 parents each
      expect(edges).toEqual(
        expect.arrayContaining([
          ['1', '2'],
          ['1', '3'],
          ['2', '4'],
          ['2', '5'],
          ['3', '6'],
          ['3', '7'],
        ]),
      );
    });

    it('should handle empty data', () => {
      const edges = getUniqueEdges({});
      expect(edges).toEqual([]);
    });

    it('should handle individuals with no parents', () => {
      const mockDataArray = [
        {
          id: '1',
          name: 'Person 1',
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
          birth: { date: '', place: '' },
          death: { date: '', place: '' },
          metadata: {},
        },
        {
          id: '2',
          name: 'Person 2',
          parents: ['3'],
          spouses: [],
          children: [],
          siblings: [],
          birth: { date: '', place: '' },
          death: { date: '', place: '' },
          metadata: {},
        },
        {
          id: '3',
          name: 'Person 3',
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
          birth: { date: '', place: '' },
          death: { date: '', place: '' },
          metadata: {},
        },
      ];

      // Convert array to Record as expected by getUniqueEdges
      const mockData = Object.fromEntries(
        mockDataArray.map((individual) => [individual.id, individual]),
      );

      const edges = getUniqueEdges(mockData);

      expect(edges).toHaveLength(1); // Only one parent relationship
      expect(edges).toEqual([['2', '3']]);
    });

    it('should handle duplicate parent relationships', () => {
      const mockDataArray = [
        {
          id: '1',
          name: 'Person 1',
          parents: ['2', '3'],
          spouses: [],
          children: [],
          siblings: [],
          birth: { date: '', place: '' },
          death: { date: '', place: '' },
          metadata: {},
        },
        {
          id: '4',
          name: 'Person 4',
          parents: ['2', '3'], // Same parents as individual 1
          spouses: [],
          children: [],
          siblings: [],
          birth: { date: '', place: '' },
          death: { date: '', place: '' },
          metadata: {},
        },
      ];

      // Convert array to Record as expected by getUniqueEdges
      const mockData = Object.fromEntries(
        mockDataArray.map((individual) => [individual.id, individual]),
      );

      const edges = getUniqueEdges(mockData);

      // Should have 4 unique edges: 1->2, 1->3, 4->2, 4->3
      expect(edges).toHaveLength(4);
      expect(edges).toEqual(
        expect.arrayContaining([
          ['1', '2'],
          ['1', '3'],
          ['4', '2'],
          ['4', '3'],
        ]),
      );
    });
  });
});
