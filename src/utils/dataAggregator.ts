import { TransportRow, Journey, RouteGroup, ChartData } from '../types';
import { fakeDistance, calculateJourneyLegs, getTransportModesString } from './distanceCalculator';

/**
 * Main data processing pipeline that transforms validated CSV data into structured application data.
 * This function performs the core business logic of the application:
 * 
 * 1. Converts each CSV row into a Journey with calculated transport legs
 * 2. Groups journeys by route (origin → destination pairs)
 * 3. Aggregates statistics for each route group
 * 
 * @param csvData - Array of validated TransportRow objects from Zod schema
 * @returns Object containing processed journeys and aggregated route groups
 */
export const processCsvData = (csvData: TransportRow[]): { journeys: Journey[], routeGroups: RouteGroup[] } => {
  
  /**
   * STEP 1: Transform each CSV row into a Journey object with calculated transport legs
   * 
   * For each row, we:
   * - Calculate pseudo-distance using the origin/destination strings
   * - Determine transport mode(s) and split journey into legs if needed
   * - Calculate weight distribution across transport modes
   */
  const journeys: Journey[] = csvData.map((row, index) => {
    // Calculate the pseudo-distance for this origin-destination pair
    // This uses a deterministic algorithm based on string characters
    const distance = fakeDistance(row.origin, row.destination);
    
    // Split the journey into transport legs based on distance
    // Distance > 1500km: Road(100) + Sea(distance-200) + Road(100)
    // Distance ≤ 1500km: Single Road leg
    const legs = calculateJourneyLegs(distance, row.weightKg);

    /**
     * CRITICAL WEIGHT CALCULATION LOGIC:
     * We need to avoid double-counting cargo weight in multi-modal journeys.
     * 
     * Problem: If a journey uses Road + Sea + Road, the same cargo (e.g., 1000kg)
     * travels on all legs, but we shouldn't count it as 3000kg total.
     * 
     * Solution: Count the full cargo weight once per transport MODE, not per leg.
     * - If journey uses Road mode (any road legs): count full weight for Road
     * - If journey uses Sea mode (any sea legs): count full weight for Sea
     */
    const usesRoad = legs.some(leg => leg.mode === 'Road');  // Check if any leg uses road transport
    const usesSea = legs.some(leg => leg.mode === 'Sea');    // Check if any leg uses sea transport

    // Assign the full cargo weight to each transport mode used (not per leg)
    const totalRoadWeight = usesRoad ? row.weightKg : 0;  // Full weight if road is used, 0 otherwise
    const totalSeaWeight = usesSea ? row.weightKg : 0;    // Full weight if sea is used, 0 otherwise

    // Create the Journey object with all calculated data
    return {
      id: `journey-${index}`,                    // Unique identifier for React keys
      route: {                                   // Route information from CSV
        origin: row.origin,
        destination: row.destination,
        originCountry: row.originCountry,
        destinationCountry: row.destinationCountry
      },
      weight: row.weightKg,                     // Original cargo weight
      distance,                                 // Calculated pseudo-distance
      legs,                                     // Array of transport legs with modes
      totalRoadWeight,                          // Weight counted for road transport
      totalSeaWeight                            // Weight counted for sea transport
    };
  });

  /**
   * STEP 2: Group journeys by route (origin → destination pairs)
   * 
   * Multiple CSV rows might have the same origin-destination pair but different weights.
   * We group these together to show aggregated statistics in the table.
   * 
   * Example: "London → Dubai" might appear 5 times with different cargo weights.
   * We want one table row showing: 5 times taken, total combined weight, etc.
   */
  const routeMap = new Map<string, Journey[]>();

  journeys.forEach(journey => {
    // Create a consistent route key for grouping (e.g., "London → Dubai")
    const routeKey = `${journey.route.origin} → ${journey.route.destination}`;
    
    // Get existing journeys for this route, or start with empty array
    const existing = routeMap.get(routeKey) || [];
    
    // Add this journey to the route group
    routeMap.set(routeKey, [...existing, journey]);
  });

  /**
   * STEP 3: Create aggregated RouteGroup objects for table display
   * 
   * Each RouteGroup represents one row in the data table and contains:
   * - Route information (origin, destination)
   * - Aggregated statistics (total weight, times taken, etc.)
   * - All individual journeys for this route
   */
  const routeGroups: RouteGroup[] = Array.from(routeMap.entries()).map(([routeKey, journeys]) => {
    // Use the first journey to get route-level information
    // (All journeys in the group have the same route, so any journey works)
    const firstJourney = journeys[0];
    const distance = firstJourney.distance;              // Distance is same for all journeys in group
    const modes = getTransportModesString(firstJourney.legs); // Transport modes are same for all journeys

    /**
     * Aggregate statistics across all journeys for this route:
     * - totalWeight: Sum of all individual cargo weights
     * - totalRoadWeight: Sum of road transport weights (avoiding double-counting)
     * - totalSeaWeight: Sum of sea transport weights (avoiding double-counting)
     */
    const totalWeight = journeys.reduce((sum, j) => sum + j.weight, 0);
    const totalRoadWeight = journeys.reduce((sum, j) => sum + j.totalRoadWeight, 0);
    const totalSeaWeight = journeys.reduce((sum, j) => sum + j.totalSeaWeight, 0);

    // Create the RouteGroup object for table display
    return {
      routeKey,                                    // Display key (e.g., "London → Dubai")
      route: {                                     // Route details for display
        origin: firstJourney.route.origin,
        destination: firstJourney.route.destination
      },
      distance,                                    // Single journey distance (km)
      timesTaken: journeys.length,                 // Number of times this route was taken
      totalDistance: distance * journeys.length,  // Cumulative distance across all journeys
      modes,                                       // Transport modes string (e.g., "Road + Sea + Road")
      totalWeight,                                 // Total cargo weight across all journeys
      totalRoadWeight,                            // Total weight transported by road
      totalSeaWeight,                             // Total weight transported by sea
      journeys                                    // Individual journey records for filtering
    };
  });

  // Return both individual journeys and aggregated route groups
  return { journeys, routeGroups };
};

/**
 * Calculates total weight by transport mode across a set of journeys.
 * This function is used for chart data generation and supports filtering.
 * 
 * @param journeys - Array of Journey objects to analyze
 * @returns ChartData object with road and sea weights for visualization
 */
export const getGlobalWeightByMode = (journeys: Journey[]): ChartData => {
  // Sum up all road transport weights across the journeys
  // Uses the totalRoadWeight field which handles double-counting correctly
  const totalRoadWeight = journeys.reduce((sum, j) => sum + j.totalRoadWeight, 0);
  
  // Sum up all sea transport weights across the journeys
  // Uses the totalSeaWeight field which handles double-counting correctly
  const totalSeaWeight = journeys.reduce((sum, j) => sum + j.totalSeaWeight, 0);

  // Return rounded values for cleaner chart display
  return {
    road: Math.round(totalRoadWeight),  // Total weight transported by road (rounded)
    sea: Math.round(totalSeaWeight)     // Total weight transported by sea (rounded)
  };
};