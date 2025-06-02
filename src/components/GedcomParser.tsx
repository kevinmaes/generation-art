import { useState } from 'react';
import { createGedcomParser } from '../facades/GedcomParserFacade';

export function GedcomParserComponent(): React.ReactElement {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);

  const loadGedcom = async () => {
    setState('loading');
    setError(null);

    try {
      // Fetch the GEDCOM file
      const response = await fetch('/gedcom-public/kennedy/kennedy.ged');
      if (!response.ok) {
        throw new Error(`Failed to fetch GEDCOM file: ${response.statusText}`);
      }

      const gedcomText = await response.text();
      console.log('GEDCOM text length:', gedcomText.length);
      console.log('GEDCOM text sample:', gedcomText.substring(0, 200));

      // Create parser using the factory
      const parser = createGedcomParser('simple');

      // Parse the GEDCOM data
      const data = parser.parse(gedcomText);
      console.log('Parsed data:', data);

      setState('success');
    } catch (err: unknown) {
      console.error('Error loading GEDCOM:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
      setState('error');
    }
  };

  return (
    <div>
      <button onClick={() => void loadGedcom()} disabled={state === 'loading'}>
        {state === 'loading' ? 'Loading...' : 'Load GEDCOM'}
      </button>

      {state === 'error' && error && (
        <div style={{ color: 'red' }}>Error: {error}</div>
      )}

      {state === 'success' && (
        <div style={{ color: 'green' }}>GEDCOM loaded successfully!</div>
      )}
    </div>
  );
}
