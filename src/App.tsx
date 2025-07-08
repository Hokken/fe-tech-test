import { JourneyProvider } from './contexts/JourneyContextProvider';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <JourneyProvider>
      <div className="min-h-screen bg-gray-50">
        <Dashboard />
      </div>
    </JourneyProvider>
  );
}

export default App;