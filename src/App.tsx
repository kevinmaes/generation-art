import { ArtGenerator } from './components/ArtGenerator';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Generation Art</h1>
      <div className="bg-white rounded-lg shadow-lg p-4">
        <ArtGenerator />
      </div>
    </div>
  );
}

export default App;
