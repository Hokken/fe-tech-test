import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useJourneyContext } from '../contexts/JourneyContext';

/**
 * TransportChart component displays weight distribution across transport modes.
 * Features:
 * - Interactive bar chart showing Road vs Sea transport weights
 * - Switches between "All Routes" and selected route data
 * - Custom colors for each transport mode
 * - Responsive design that adapts to container size
 * - Conditional rendering based on data availability
 */
export function TransportChart() {
  // Get chart data and route selection from global context
  // selectedRouteChartData automatically switches between all routes and selected route
  const { selectedRouteChartData, selectedRoute, setSelectedRoute } = useJourneyContext();

  /**
   * Transform our internal ChartData format to Recharts format.
   * Recharts expects an array of objects where each object represents one bar.
   * 
   * Our data: { road: 1500, sea: 2300 }
   * Recharts needs: [{ mode: 'Road', weight: 1500, fill: '#3B82F6' }, ...]
   */
  const chartData = [
    {
      mode: 'Road',                           // X-axis label
      weight: selectedRouteChartData.road,    // Y-axis value (height of bar)
      fill: '#3B82F6'                        // Blue color for road transport
    },
    {
      mode: 'Sea',                            // X-axis label
      weight: selectedRouteChartData.sea,     // Y-axis value (height of bar)
      fill: '#10B981'                        // Green color for sea transport
    }
  ];

  /**
   * Dynamic title that shows context of current data display.
   * Changes based on whether user has selected a specific route or viewing all routes.
   */
  const title = selectedRoute 
    ? `Weight by Transport Mode: ${selectedRoute}`     // Specific route selected
    : 'Total Weight by Transport Mode (All Routes)';   // All routes view

  /**
   * Check if we have any data to display.
   * Used to show placeholder message instead of empty chart when no CSV is loaded.
   */
  const hasData = selectedRouteChartData.road > 0 || selectedRouteChartData.sea > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6" data-testid="transport-chart">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>

      <div className="h-80">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="mode"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Weight']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px'
                }}
              />
              <Bar
                dataKey="weight"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Upload a CSV file to view transport data
          </div>
        )}
      </div>

      {selectedRoute && (
        <button
          onClick={() => setSelectedRoute(null)}
          className="mt-4 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
        >
          ← Back to All Routes
        </button>
      )}
    </div>
  );
}