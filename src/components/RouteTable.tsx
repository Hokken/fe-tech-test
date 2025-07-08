import { useState, useMemo } from 'react';
import { useJourneyContext } from '../contexts/JourneyContext';

// Define the columns that can be sorted in the table
type SortField = 'route' | 'distance' | 'timesTaken' | 'totalDistance' | 'modes';
type SortDirection = 'asc' | 'desc';

/**
 * RouteTable component displays aggregated route data in a sortable table format.
 * Features:
 * - Sortable columns with visual indicators (↑/↓)
 * - Row selection that updates the chart display
 * - Responsive design with horizontal scroll for smaller screens
 * - Performance-optimized sorting with useMemo
 */
export function RouteTable() {
  // Get route data and selection state from global context
  const { routeGroups, selectedRoute, setSelectedRoute } = useJourneyContext();
  
  // Local state for table sorting functionality
  const [sortField, setSortField] = useState<SortField>('route');        // Which column to sort by
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc'); // Sort direction

  /**
   * Handles column header clicks for sorting.
   * Logic:
   * - If clicking the same column: toggle between asc/desc
   * - If clicking a different column: switch to that column and reset to asc
   * 
   * @param field - The column/field to sort by
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Same column clicked - toggle sort direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Different column clicked - switch column and reset to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /**
   * Handles row selection and scrolls to chart for better UX.
   * This is especially important on mobile where the chart might be out of view.
   * 
   * @param routeKey - The route key to select, or null to deselect
   */
  const handleRowClick = (routeKey: string) => {
    // Update selected route
    const newSelection = selectedRoute === routeKey ? null : routeKey;
    setSelectedRoute(newSelection);
    
    // Scroll to chart when a route is selected (not when deselecting)
    if (newSelection) {
      // Find the chart element by looking for TransportChart component content
      // We'll scroll to the chart container which should be above the table
      const chartElement = document.querySelector('[data-testid="transport-chart"]') || 
                          document.querySelector('.recharts-wrapper') ||
                          document.querySelector('h1'); // Fallback to page header
      
      if (chartElement) {
        chartElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }
  };

  /**
   * Memoized sorting function that creates a sorted copy of route groups.
   * This optimization prevents unnecessary re-sorting on every render.
   * Only recalculates when routeGroups, sortField, or sortDirection changes.
   */
  const sortedRoutes = useMemo(() => {
    // Create a copy of routeGroups to avoid mutating the original array
    const sorted = [...routeGroups].sort((a, b) => {
      // Variables to hold the values being compared
      let aValue: string | number;
      let bValue: string | number;

      /**
       * Extract the appropriate field values for comparison based on sortField.
       * We use a switch statement to handle different column types:
       * - route: String comparison (e.g., "London → Dubai")
       * - distance: Numeric comparison (kilometers)
       * - timesTaken: Numeric comparison (count of journeys)
       * - totalDistance: Numeric comparison (cumulative kilometers)
       * - modes: String comparison (e.g., "Road + Sea + Road")
       */
      switch (sortField) {
        case 'route':
          aValue = a.routeKey;         // e.g., "London → Dubai"
          bValue = b.routeKey;
          break;
        case 'distance':
          aValue = a.distance;         // Single journey distance in km
          bValue = b.distance;
          break;
        case 'timesTaken':
          aValue = a.timesTaken;       // Number of times this route was taken
          bValue = b.timesTaken;
          break;
        case 'totalDistance':
          aValue = a.totalDistance;    // distance × timesTaken
          bValue = b.totalDistance;
          break;
        case 'modes':
          aValue = a.modes;            // e.g., "Road + Sea + Road"
          bValue = b.modes;
          break;
      }

      /**
       * Perform the actual comparison based on data type.
       * 
       * String comparison: Uses localeCompare for proper internationalization
       * and case-insensitive sorting (e.g., "Amsterdam" vs "berlin")
       * 
       * Numeric comparison: Simple subtraction for ascending/descending order
       */
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // String comparison using locale-aware sorting
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)      // A-Z ascending
          : bValue.localeCompare(aValue);     // Z-A descending
      } else {
        // Numeric comparison using subtraction
        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)  // Low to high
          : (bValue as number) - (aValue as number); // High to low
      }
    });

    return sorted;
  }, [routeGroups, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  if (routeGroups.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Routes</h2>
      </div>

      {/* Desktop table view - hidden on mobile */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('route')}
              >
                Route{getSortIcon('route')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('distance')}
              >
                Distance (km){getSortIcon('distance')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('timesTaken')}
              >
                Times Taken{getSortIcon('timesTaken')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('totalDistance')}
              >
                Total Distance (km){getSortIcon('totalDistance')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('modes')}
              >
                Mode{getSortIcon('modes')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRoutes.map((route) => (
              <tr
                key={route.routeKey}
                onClick={() => handleRowClick(route.routeKey)}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedRoute === route.routeKey ? 'bg-blue-50 ring-2 ring-blue-500' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {route.route.origin} → {route.route.destination}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.distance.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.timesTaken}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.totalDistance.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.modes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view - visible only on mobile */}
      <div className="sm:hidden space-y-4 p-4">
        {sortedRoutes.map((route) => (
          <div
            key={route.routeKey}
            onClick={() => handleRowClick(route.routeKey)}
            className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedRoute === route.routeKey 
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' 
                : 'border-gray-200'
            }`}
          >
            <div className="space-y-3">
              <div className="font-medium text-gray-900 text-base">
                {route.route.origin} → {route.route.destination}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">Distance:</span>
                  <div className="text-gray-900">{route.distance.toLocaleString()} km</div>
                </div>
                
                <div>
                  <span className="text-gray-500 font-medium">Times Taken:</span>
                  <div className="text-gray-900">{route.timesTaken}</div>
                </div>
                
                <div>
                  <span className="text-gray-500 font-medium">Total Distance:</span>
                  <div className="text-gray-900">{route.totalDistance.toLocaleString()} km</div>
                </div>
                
                <div>
                  <span className="text-gray-500 font-medium">Mode:</span>
                  <div className="text-gray-900">{route.modes}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}