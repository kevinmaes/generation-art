import React, { useState, useEffect } from 'react';
import { FramedArtwork } from './display/components/FramedArtwork';
import { CANVAS_DIMENSIONS } from '../../shared/constants';
import './App.css';

interface FamilyTreeData {
  individuals: unknown[];
  families: unknown[];
  metadata?: unknown;
}

function App(): React.ReactElement {
  const [familyTreeData, setFamilyTreeData] = useState<FamilyTreeData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'file-select' | 'artwork'>(
    'file-select',
  );

  const minWidth = CANVAS_DIMENSIONS.WEB.WIDTH;
  const minHeight = CANVAS_DIMENSIONS.WEB.HEIGHT;

  // Check for autoLoad parameter and load Kennedy data automatically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoLoad = urlParams.get('autoLoad');

    if (
      autoLoad === 'true' &&
      currentView === 'file-select' &&
      !familyTreeData
    ) {
      console.log('🔄 Auto-loading Kennedy family tree data...');
      void handleLoadKennedy();
    }
  }, [currentView, familyTreeData]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;

      // Handle both array format (enhanced) and object format (raw)
      if (Array.isArray(data)) {
        // Enhanced format: array of individuals with metadata
        setFamilyTreeData({ individuals: data, families: [] });
      } else if (
        typeof data === 'object' &&
        data !== null &&
        'individuals' in data &&
        'families' in data &&
        Array.isArray(
          (data as { individuals: unknown; families: unknown }).individuals,
        ) &&
        Array.isArray(
          (data as { individuals: unknown; families: unknown }).families,
        )
      ) {
        // Raw format: object with individuals and families
        setFamilyTreeData(data as FamilyTreeData);
      } else {
        throw new Error(
          'Invalid file format. Expected array of individuals or object with "individuals" and "families" arrays.',
        );
      }
      setCurrentView('artwork');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadKennedy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/generated/parsed/kennedy.json?t=${String(Date.now())}`,
      );
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (!response.ok) {
        throw new Error(`Failed to load Kennedy data: ${response.statusText}`);
      }

      const text = await response.text();
      console.log('Response text (first 200 chars):', text.substring(0, 200));

      if (!contentType?.includes('application/json')) {
        throw new Error(
          `Expected JSON but got ${contentType ?? 'unknown content type'}`,
        );
      }

      const data = JSON.parse(text) as FamilyTreeData;
      setFamilyTreeData(data);
      setCurrentView('artwork');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load Kennedy data',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-gray-100 flex items-center justify-center"
      style={{ minWidth, minHeight }}
    >
      <div
        className="flex flex-col justify-center items-center w-full h-full"
        style={{ minWidth, minHeight }}
      >
        <div className="max-w-7xl w-full" style={{ minWidth }}>
          <div className="pt-12 pb-8 text-center">
            <h1 className="text-5xl font-extrabold mb-3 text-gray-800 tracking-tight drop-shadow-sm">
              Generation Art
            </h1>
            <p className="text-lg text-gray-500 mb-4">
              Visualizing family trees through generative art
            </p>
            {currentView === 'artwork' && (
              <button
                onClick={() => {
                  setCurrentView('file-select');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mt-2"
              >
                Load Different File
              </button>
            )}
          </div>
          {currentView === 'artwork' && familyTreeData ? (
            <FramedArtwork
              title="Family Tree Visualization"
              subtitle="Generative visualization of family connections and generations"
              width={minWidth}
              height={minHeight}
              jsonFile={'generated/parsed/kennedy.json'}
              className="mb-8"
            />
          ) : (
            <div
              className="flex flex-col items-center justify-center"
              style={{ minWidth, minHeight }}
            >
              <div
                className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl"
                style={{ minWidth: Math.min(500, minWidth) }}
              >
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Load Family Tree Data
                </h2>
                {error && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}
                <div className="space-y-6">
                  {/* File Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-lg font-medium text-blue-600 hover:text-blue-500">
                          Choose a JSON file
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".json"
                        className="sr-only"
                        onChange={(event) => {
                          void handleFileSelect(event);
                        }}
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Select a CLI-processed JSON file from the generated folder
                    </p>
                  </div>
                  {/* Quick Load Kennedy Button */}
                  <div className="text-center">
                    <div className="text-gray-500 mb-2">or</div>
                    <button
                      onClick={() => {
                        void handleLoadKennedy();
                      }}
                      disabled={isLoading}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading
                        ? 'Loading...'
                        : 'Load Kennedy Family Tree (Development)'}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Quick development option - loads the Kennedy family data
                    </p>
                  </div>
                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <p className="mt-2 text-gray-600">Processing file...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
