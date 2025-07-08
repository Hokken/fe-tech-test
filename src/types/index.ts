// Re-export TransportRow from schema for backward compatibility
export type { TransportRow } from '../schemas/transportRowSchema';

// Transport mode types
export type TransportMode = 'Road' | 'Sea';

// Individual journey leg
export type JourneyLeg = {
  mode: TransportMode;
  distance: number;
  weight: number;
};

// Processed journey with calculated data
export type Journey = {
  id: string; // unique identifier
  route: {
    origin: string;
    destination: string;
    originCountry: string;
    destinationCountry: string;
  };
  weight: number;
  distance: number;
  legs: JourneyLeg[];
  totalRoadWeight: number;
  totalSeaWeight: number;
};

// Aggregated route data for the table
export type RouteGroup = {
  routeKey: string; // "London → Dubai"
  route: {
    origin: string;
    destination: string;
  };
  distance: number;
  timesTaken: number; // count of journeys
  totalDistance: number; // distance * timesTaken
  modes: string; // "Road + Sea + Road" or "Road"
  totalWeight: number;
  totalRoadWeight: number;
  totalSeaWeight: number;
  journeys: Journey[];
};

// Chart data format
export type ChartData = {
  road: number;
  sea: number;
};