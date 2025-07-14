import { useState, useEffect, useCallback } from 'react';
import type { AugmentedIndividual } from './types';

interface GedcomLoaderProps {
  familyName: string;
  onDataLoaded: (data: AugmentedIndividual[]) => void;
  onError?: (error: string) => void;
}

export function GedcomLoader({
  familyName,
  onDataLoaded,
  onError,
}: GedcomLoaderProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stabilize the callbacks to prevent infinite loops
  const stableOnDataLoaded = useCallback(onDataLoaded, []);
  const stableOnError = useCallback(
    onError ??
      (() => {
        // Default error handler
      }),
    [],
  );

  useEffect(() => {
    const loadFamilyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to load from generated directory first (private files)
        const response = await fetch(
          `/generated/parsed/${familyName}-augmented.json`,
        );

        if (!response.ok) {
          // Fallback to public directory for demo data
          const fallbackResponse = await fetch(
            `/gedcom-public/${familyName}/${familyName}-augmented.json`,
          );
          if (!fallbackResponse.ok) {
            throw new Error(`Family data not found: ${familyName}`);
          }
          const data = (await fallbackResponse.json()) as AugmentedIndividual[];
          stableOnDataLoaded(data);
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

    if (familyName) {
      void loadFamilyData();
    }
  }, [familyName, stableOnDataLoaded, stableOnError]);

  if (loading) return <div>Loading family data...</div>;
  if (error) return <div>Error: {error}</div>;
  return <></>;
}
