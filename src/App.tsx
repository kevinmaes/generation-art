import React, { useState } from 'react';
import { ArtGenerator } from './components/ArtGenerator';
import './App.css';

function App(): React.ReactElement {
  const [familyName, setFamilyName] = useState('kennedy');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Generation Art</h1>

      <div className="mb-4">
        <label
          htmlFor="familyName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Family Name:
        </label>
        <input
          id="familyName"
          type="text"
          value={familyName}
          onChange={(e) => {
            setFamilyName(e.target.value);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter family name (e.g., kennedy, my-family)"
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter the name of your GEDCOM file (without .ged extension)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <ArtGenerator width={1000} height={800} familyName={familyName} />
      </div>
    </div>
  );
}

export default App;
