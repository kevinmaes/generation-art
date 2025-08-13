import React from 'react';

interface GedcomFile {
  id: string;
  name: string;
  description: string;
  individualCount?: number;
  generationCount?: number;
}

interface GedcomSelectorProps {
  onSelect: (datasetId: string) => void;
  currentDataset?: string;
  disabled?: boolean;
}

const AVAILABLE_GEDCOM_FILES: GedcomFile[] = [
  {
    id: 'nuclear-family',
    name: 'Nuclear Family',
    description: 'Simple test family (2 parents, 3 children)',
    individualCount: 5,
    generationCount: 2,
  },
  {
    id: 'kennedy-small',
    name: 'Kennedy Small',
    description: 'Small Kennedy family subset',
    individualCount: 10,
    generationCount: 3,
  },
  {
    id: 'kennedy',
    name: 'Kennedy Full',
    description: 'Complete Kennedy family tree',
    individualCount: 73,
    generationCount: 5,
  },
  {
    id: 'shakespeare',
    name: 'Shakespeare',
    description: 'William Shakespeare family',
    individualCount: 20,
    generationCount: 4,
  },
  {
    id: 'bronte',
    name: 'Brontë',
    description: 'Brontë literary family',
    individualCount: 15,
    generationCount: 3,
  },
  {
    id: 'royal92',
    name: 'Royal 92',
    description: 'European royal families',
    individualCount: 500,
    generationCount: 10,
  },
  {
    id: 'pres2020',
    name: 'Presidents 2020',
    description: 'US Presidents genealogy',
    individualCount: 400,
    generationCount: 8,
  },
];

export function GedcomSelector({
  onSelect,
  currentDataset,
  disabled = false,
}: GedcomSelectorProps): React.ReactElement {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  const selectedFile = AVAILABLE_GEDCOM_FILES.find(f => f.id === currentDataset);

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select GEDCOM Dataset
      </label>
      <select
        value={currentDataset || ''}
        onChange={handleChange}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">-- Select a dataset --</option>
        {AVAILABLE_GEDCOM_FILES.map((file) => (
          <option key={file.id} value={file.id}>
            {file.name} 
            {file.individualCount && ` (${file.individualCount} people)`}
          </option>
        ))}
      </select>
      
      {selectedFile && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm">
            <div className="font-medium text-blue-900">{selectedFile.name}</div>
            <div className="text-blue-700 mt-1">
              {selectedFile.description}
              {selectedFile.individualCount && selectedFile.generationCount && (
                <div className="mt-1">
                  • {selectedFile.individualCount} individuals<br/>
                  • {selectedFile.generationCount} generations
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        These are pre-processed GEDCOM files available for testing.
        Make sure the corresponding JSON files exist in /public/generated/
      </div>
    </div>
  );
}