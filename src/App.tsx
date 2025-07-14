import React, { useState } from 'react';
import { ArtGenerator } from './components/ArtGenerator';
import './App.css';

function App(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Generation Art</h1>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <ArtGenerator width={1000} height={800} familyName={familyName} />
      </div>
    </div>
  );
}

export default App;
