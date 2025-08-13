import React, { useEffect, useState } from 'react';

interface GedcomFile {
  id: string;
  name: string;
  fileName?: string;
  description?: string;
  individualCount?: number;
  familyCount?: number;
  generationCount?: number;
  sourcePath?: string;
}

interface GedcomManifest {
  version: string;
  generated: string;
  datasets: GedcomFile[];
}

interface GedcomSelectorProps {
  onSelect: (datasetId: string) => void;
  currentDataset?: string;
  disabled?: boolean;
}

export function GedcomSelector({
  onSelect,
  currentDataset,
  disabled = false,
}: GedcomSelectorProps): React.ReactElement {
  const [availableFiles, setAvailableFiles] = useState<GedcomFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the manifest file to get available datasets
    const fetchManifest = async () => {
      try {
        const response = await fetch('/generated/parsed/manifest.json');
        if (!response.ok) {
          throw new Error('Failed to fetch manifest');
        }
        const manifest = (await response.json()) as GedcomManifest;

        // Sort datasets by name for consistent ordering
        const sortedDatasets = manifest.datasets.sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        setAvailableFiles(sortedDatasets);
        setError(null);
      } catch (err) {
        console.error('Error loading GEDCOM manifest:', err);
        setError('Failed to load available datasets');
        // Fallback to empty list
        setAvailableFiles([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchManifest();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  const selectedFile = availableFiles.find((f) => f.id === currentDataset);

  if (loading) {
    return (
      <div className="w-full max-w-md">
        <div className="text-sm text-gray-500">
          Loading available datasets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md">
        <div className="text-sm text-red-600">{error}</div>
        <div className="text-xs text-gray-500 mt-1">
          Run `pnpm gedcom:build:all` to generate datasets
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select GEDCOM Dataset
        {availableFiles.length > 0 && (
          <span className="text-xs text-gray-500 ml-2">
            ({availableFiles.length} available)
          </span>
        )}
      </label>

      {availableFiles.length === 0 ? (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-sm text-yellow-800">
            No datasets available. Run `pnpm gedcom:build:all` to generate
            datasets.
          </div>
        </div>
      ) : (
        <>
          <select
            value={currentDataset ?? ''}
            onChange={handleChange}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Select a dataset --</option>
            {availableFiles.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name}
                {file.individualCount && ` (${String(file.individualCount)} people)`}
              </option>
            ))}
          </select>

          {selectedFile && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm">
                <div className="font-medium text-blue-900">
                  {selectedFile.name}
                </div>
                <div className="text-blue-700 mt-1">
                  {selectedFile.individualCount && selectedFile.familyCount && (
                    <div className="mt-1">
                      • {selectedFile.individualCount} individuals
                      <br />• {selectedFile.familyCount} families
                      {selectedFile.generationCount &&
                        selectedFile.generationCount > 0 && (
                          <>
                            <br />• {selectedFile.generationCount} generations
                          </>
                        )}
                    </div>
                  )}
                  {selectedFile.sourcePath && (
                    <div className="mt-1 text-xs text-blue-600">
                      Source: {selectedFile.sourcePath}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-3 text-xs text-gray-500">
        Datasets are dynamically loaded from
        /public/generated/parsed/manifest.json
      </div>
    </div>
  );
}
