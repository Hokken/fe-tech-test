import { useState, useCallback, useMemo, ReactNode } from "react";
import { TransportRow, Journey, RouteGroup } from "../types";
import { processCsvData, getGlobalWeightByMode } from "../utils/dataAggregator";
import { JourneyContext } from "./JourneyContext";

/**
 * JourneyProvider component that manages global state for the transport analytics application.
 * This provider handles all data processing, state management, and computed values derived from CSV data.
 * 
 * Key responsibilities:
 * - Process raw CSV data into structured journey and route data
 * - Manage UI state (loading, errors, selected route)
 * - Compute chart data for visualization
 * - Provide optimized data access to child components
 */
export function JourneyProvider({ children }: { children: ReactNode }) {
	// Core data state - holds the processed journey information
	const [journeys, setJourneys] = useState<Journey[]>([]);           // Individual journey records with legs/weights
	const [routeGroups, setRouteGroups] = useState<RouteGroup[]>([]);  // Aggregated route data for table display
	const [selectedRoute, setSelectedRoute] = useState<string | null>(null); // Currently selected route for filtering
	
	// UI state management
	const [isLoading, setIsLoading] = useState(false);    // Loading indicator during data processing
	const [error, setError] = useState<string | null>(null); // Error message for failed operations

	/**
	 * Computed chart data for all routes combined.
	 * This memoized value calculates total weight by transport mode (Road/Sea) across all journeys.
	 * 
	 * Dependencies: [journeys] - Recalculates when journey data changes
	 * Performance: Prevents unnecessary calculations on every render
	 */
	const allRoutesChartData = useMemo(
		() => getGlobalWeightByMode(journeys),
		[journeys]
	);

	/**
	 * Computed chart data for the currently selected route only.
	 * This provides filtered data when a user clicks on a specific route in the table.
	 * 
	 * Logic:
	 * - If no route selected: return allRoutesChartData (show everything)
	 * - If route selected: find the route group and calculate weight for that route only
	 * - If selected route not found: fallback to allRoutesChartData
	 * 
	 * Dependencies: [selectedRoute, routeGroups, allRoutesChartData]
	 * Performance: Only recalculates when route selection or data changes
	 */
	const selectedRouteChartData = useMemo(() => {
		// No route selected - show all data
		if (!selectedRoute) return allRoutesChartData;
		
		// Find the specific route group by its key (e.g., "London → Dubai")
		const route = routeGroups.find(
			(r) => r.routeKey === selectedRoute
		);
		
		// Calculate weight data for this specific route's journeys only
		return route
			? getGlobalWeightByMode(route.journeys)
			: allRoutesChartData; // Fallback if route not found
	}, [selectedRoute, routeGroups, allRoutesChartData]);

	/**
	 * Processes validated CSV data through the entire data pipeline.
	 * This function handles the transformation from raw CSV rows to our application data structures.
	 * 
	 * Processing steps:
	 * 1. Calculate distances for each origin-destination pair
	 * 2. Apply journey splitting logic (road/sea based on distance)
	 * 3. Aggregate journeys by route for table display
	 * 4. Update global state with processed data
	 * 
	 * @param csvData - Array of validated TransportRow objects from Zod schema
	 * @throws Error if data processing fails
	 */
	const loadJourneyData = useCallback(async (csvData: TransportRow[]) => {
		// Set loading state to show spinner/disable UI
		setIsLoading(true);
		setError(null); // Clear any previous errors

		try {
			// Process the CSV data through our business logic pipeline
			// This includes distance calculation, journey splitting, and route aggregation
			const { journeys, routeGroups } = processCsvData(csvData);
			
			// Update global state with processed data
			setJourneys(journeys);         // Individual journey records
			setRouteGroups(routeGroups);   // Aggregated route data for table
			setSelectedRoute(null);        // Reset any previous route selection
		} catch (err) {
			// Handle processing errors with user-friendly messages
			setError(
				err instanceof Error
					? err.message
					: "Failed to process data"
			);
		} finally {
			// Always clear loading state, regardless of success/failure
			setIsLoading(false);
		}
	}, []); // No dependencies - function never changes

	/**
	 * Provider component that makes all journey data and actions available
	 * to any child component through the useJourneyContext hook.
	 * 
	 * The value object contains:
	 * - Raw data: journeys, routeGroups, selectedRoute
	 * - Computed data: allRoutesChartData, selectedRouteChartData
	 * - Actions: setSelectedRoute, loadJourneyData
	 * - UI state: isLoading, error
	 */
	return (
		<JourneyContext.Provider
			value={{
				// Core data
				journeys,
				routeGroups,
				selectedRoute,
				
				// Computed chart data (memoized for performance)
				allRoutesChartData,
				selectedRouteChartData,
				
				// User actions
				setSelectedRoute,
				loadJourneyData,
				
				// UI state
				isLoading,
				error,
			}}
		>
			{children}
		</JourneyContext.Provider>
	);
}
