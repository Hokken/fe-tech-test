import { JourneyLeg } from '../types';

/**
 * Calculates a pseudo-distance between two locations using string-based algorithm.
 * This provides consistent, reproducible distances for the same origin-destination pairs
 * without requiring real geographic data or API calls.
 * 
 * Algorithm explanation:
 * 1. Concatenate origin and destination strings (e.g., "London" + "Dubai" = "LondonDubai")
 * 2. Sum the ASCII character codes of all characters
 * 3. Take absolute value and apply modulo 3000 to keep distances reasonable
 * 4. Add 100 to ensure minimum distance (100-3099 km range)
 * 
 * This ensures:
 * - Same origin-destination always produces same distance
 * - Distances are in realistic range for transport planning
 * - No external dependencies or API calls required
 * 
 * @param from - Origin city/location name
 * @param to - Destination city/location name
 * @returns Pseudo-distance in kilometers (100-3099 range)
 */
export const fakeDistance = (from: string, to: string): number => {
  // Combine origin and destination into single string
  const str = from + to;
  
  // Calculate sum of ASCII character codes
  // [...str] spreads string into array of characters for processing
  const charCodeSum = [...str].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Apply mathematical transformation to get distance in reasonable range
  // Math.abs() ensures positive value
  // % 3000 limits maximum distance to 2999km
  // + 100 ensures minimum distance of 100km
  return Math.abs(charCodeSum) % 3000 + 100;
};

/**
 * Determines transport legs for a journey based on distance and business rules.
 * 
 * Business Logic:
 * - Long distances (> 1500km): Use multi-modal transport (Road + Sea + Road)
 *   - First leg: Road transport for 100km (local pickup/delivery)
 *   - Middle leg: Sea transport for remaining distance minus 200km
 *   - Last leg: Road transport for 100km (local pickup/delivery)
 * 
 * - Short distances (≤ 1500km): Use single-modal transport (Road only)
 *   - Single leg: Road transport for entire distance
 * 
 * This reflects real-world logistics where:
 * - Long-distance shipping often combines road and sea transport
 * - Road transport handles "first mile" and "last mile" delivery
 * - Sea transport handles long-distance bulk shipping
 * - Short distances can be handled entirely by road
 * 
 * @param distance - Total journey distance in kilometers
 * @param weight - Cargo weight in kilograms (applied to each leg)
 * @returns Array of JourneyLeg objects representing the transport plan
 */
export const calculateJourneyLegs = (distance: number, weight: number): JourneyLeg[] => {
  if (distance > 1500) {
    /**
     * LONG DISTANCE: Multi-modal transport (Road + Sea + Road)
     * 
     * Example for 2500km journey:
     * - Road: 100km (local pickup)
     * - Sea: 2300km (2500 - 200km for road segments)
     * - Road: 100km (local delivery)
     * 
     * Note: Each leg carries the same cargo weight, but this doesn't mean
     * we count the weight multiple times in aggregations (handled in dataAggregator)
     */
    return [
      { 
        mode: 'Road',               // Local pickup/collection
        distance: 100,              // Fixed 100km for local road transport
        weight                      // Full cargo weight travels on this leg
      },
      { 
        mode: 'Sea',                // Long-distance sea freight
        distance: distance - 200,   // Total distance minus 200km (2x100km road legs)
        weight                      // Same cargo continues on sea leg
      },
      { 
        mode: 'Road',               // Local delivery
        distance: 100,              // Fixed 100km for local road transport  
        weight                      // Same cargo delivered by road
      }
    ];
  } else {
    /**
     * SHORT DISTANCE: Single-modal transport (Road only)
     * 
     * For distances ≤ 1500km, road transport is sufficient and more efficient
     * than multi-modal combinations. This represents direct trucking or
     * regional road freight networks.
     */
    return [
      { 
        mode: 'Road',               // Direct road transport
        distance,                   // Full journey distance by road
        weight                      // Full cargo weight
      }
    ];
  }
};

/**
 * Creates a human-readable string describing the transport modes used in a journey.
 * This is used for table display to show users how their cargo will be transported.
 * 
 * Examples:
 * - Single road journey: "Road"
 * - Multi-modal journey: "Road + Sea + Road"
 * 
 * @param legs - Array of JourneyLeg objects from calculateJourneyLegs
 * @returns String representation of transport modes (e.g., "Road + Sea + Road")
 */
export const getTransportModesString = (legs: JourneyLeg[]): string => {
  // Extract just the transport mode from each leg
  const modes = legs.map(leg => leg.mode);
  
  // Join with " + " separator for clear display
  // e.g., ["Road", "Sea", "Road"] becomes "Road + Sea + Road"
  return modes.join(' + ');
};