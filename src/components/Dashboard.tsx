import { useJourneyContext } from '../contexts/JourneyContext';
import { FileUpload } from './FileUpload';
import { TransportChart } from './TransportChart';
import { RouteTable } from './RouteTable';
import { ErrorBoundary } from './ErrorBoundary';

export function Dashboard() {
  const { isLoading, error } = useJourneyContext();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Transport Analytics Dashboard</h1>

      <FileUpload />

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading data...</div>
        </div>
      ) : (
        <>
          <ErrorBoundary>
            <TransportChart />
          </ErrorBoundary>
          
          <ErrorBoundary>
            <RouteTable />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}