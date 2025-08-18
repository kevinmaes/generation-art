import React, { useMemo } from 'react';
import type { GedcomDataWithMetadata } from '../../../shared/types';

interface PrimaryIndividualSelectorProps {
  gedcomData: GedcomDataWithMetadata | null;
  value: string | undefined;
  onChange: (individualId: string | undefined) => void;
  className?: string;
}

export function PrimaryIndividualSelector({
  gedcomData,
  value,
  onChange,
  className = '',
}: PrimaryIndividualSelectorProps): React.ReactElement {
  // Prepare sorted list of individuals with generation numbers
  const sortedIndividuals = useMemo(() => {
    if (!gedcomData?.individuals) return [];

    const individuals = Object.values(gedcomData.individuals);

    // Sort by generation (lowest first), then by name
    return individuals
      .map((individual) => ({
        id: individual.id,
        name: individual.name || `Individual ${individual.id}`,
        generation: individual.metadata?.generation ?? 999, // Use 999 for unknown generation
      }))
      .sort((a, b) => {
        // First sort by generation
        if (a.generation !== b.generation) {
          return a.generation - b.generation;
        }
        // Then by name
        return a.name.localeCompare(b.name);
      });
  }, [gedcomData]);

  // Find first individual if no value is set
  const defaultValue = useMemo(() => {
    if (value) return value;
    if (sortedIndividuals.length > 0) {
      // Find someone in the middle generations for better visualization
      const generations = [
        ...new Set(sortedIndividuals.map((i) => i.generation)),
      ].sort((a, b) => a - b);
      if (generations.length > 2) {
        const middleGen = generations[Math.floor(generations.length / 2)];
        const middleGenIndividuals = sortedIndividuals.filter(
          (i) => i.generation === middleGen,
        );
        return middleGenIndividuals[0]?.id;
      }
      return sortedIndividuals[0]?.id;
    }
    return undefined;
  }, [value, sortedIndividuals]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    onChange(newValue === '' ? undefined : newValue);
  };

  if (!gedcomData || sortedIndividuals.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No individuals available
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor="primary-individual"
        className="text-sm font-medium text-gray-700"
      >
        Primary individual
      </label>
      <select
        id="primary-individual"
        value={value || defaultValue || ''}
        onChange={handleChange}
        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select an individual...</option>
        {sortedIndividuals.map((individual) => (
          <option key={individual.id} value={individual.id}>
            Gen {individual.generation} | {individual.id}: {individual.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Select the focal individual for visualizations
      </p>
    </div>
  );
}
