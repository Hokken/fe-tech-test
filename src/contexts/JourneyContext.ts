import { createContext, useContext } from 'react';
import { TransportRow, Journey, RouteGroup, ChartData } from '../types';

/**
 * JourneyContextType defines the shape of our global application state and actions.
 * This context manages all data related to transport journeys, including:
 * - Raw journey data processed from CSV
 * - Aggregated route groups for table display
 * - Chart data for visualization
 * - UI state (selected route, loading, errors)
 */
export type JourneyContextType = {
    // Core Data Storage
    journeys: Journey[];           // Array of individual journey records with calculated legs
    routeGroups: RouteGroup[];     // Aggregated data grouped by origin->destination pairs
    selectedRoute: string | null;  // Currently selected route key (e.g., "London → Dubai")

    // Computed Chart Data (derived from above data)
    allRoutesChartData: ChartData;     // Total weight by transport mode across all routes
    selectedRouteChartData: ChartData; // Weight by transport mode for selected route only

    // User Actions
    setSelectedRoute: (routeKey: string | null) => void; // Select/deselect a route for chart filtering
    loadJourneyData: (csvData: TransportRow[]) => void;  // Process and load new CSV data

    // UI State Management
    isLoading: boolean;  // True when processing CSV data
    error: string | null; // Error message if data processing fails
}

/**
 * React Context for sharing journey data throughout the component tree.
 * Initialized as undefined to force proper provider usage.
 */
export const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

/**
 * Custom hook for consuming the Journey context with built-in error handling.
 * This hook ensures components are properly wrapped in a JourneyProvider
 * and provides type-safe access to the context data.
 * 
 * @throws Error if used outside of JourneyProvider
 * @returns JourneyContextType - All journey data and actions
 */
export function useJourneyContext() {
    const context = useContext(JourneyContext);
    
    // Runtime check to ensure proper provider usage
    if (context === undefined) {
        throw new Error('useJourneyContext must be used within a JourneyProvider');
    }
    
    return context;
} 