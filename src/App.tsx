import React from 'react';
import { FramedArtwork } from './components/FramedArtwork';
import { CANVAS_DIMENSIONS } from './constants';
import './App.css';

function App(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-800">
          Generation Art
        </h1>
        <p className="text-gray-600 mb-8">
          Visualizing family trees through generative art
        </p>

        <FramedArtwork
          title="Kennedy Family Tree"
          subtitle="Generative visualization of family connections and generations"
          width={CANVAS_DIMENSIONS.WEB.WIDTH}
          height={CANVAS_DIMENSIONS.WEB.HEIGHT}
          jsonFile={'generated/parsed/kennedy-augmented.json'}
          className="mb-8"
        />
      </div>
    </div>
  );
}

export default App;
