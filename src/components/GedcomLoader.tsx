import { useState, useEffect, useCallback } from 'react';
import type { AugmentedIndividual } from './types';

interface GedcomLoaderProps {
  jsonFile: string;
  onDataLoaded: (data: AugmentedIndividual[]) => void;
  onError?: (error: string) => void;
}

export function GedcomLoader({
  jsonFile,
  onDataLoaded,
  onError,
}: GedcomLoaderProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stabilize the callbacks to prevent infinite loops
  const stableOnDataLoaded = useCallback(
    (data: AugmentedIndividual[]) => {
      onDataLoaded(data);
    },
    [onDataLoaded],
  );
  const stableOnError = useCallback(
    (error: string) => {
      onError?.(error);
    },
    [onError],
  );

  useEffect(() => {
    const loadFamilyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to load from generated directory first (private files)
        const response = await fetch(jsonFile);

        if (!response.ok) {
          throw new Error(`Family data not found: ${jsonFile}`);
        } else {
          const data = (await response.json()) as AugmentedIndividual[];
          stableOnDataLoaded(data);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load family data';
        setError(errorMessage);
        stableOnError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (jsonFile) {
      void loadFamilyData();
    }
  }, [jsonFile, stableOnDataLoaded, stableOnError]);

  if (loading) return <div>Loading family data...</div>;
  if (error) return <div>Error: {error}</div>;
  return <></>;
}
