1. install react + typescript with a vite template
2. install all necessary packages (tailwind, recharts, papaparse)
3. I want to be able to upload the CSV file

## COMPONENTS
src/
├── contexts/
│   └── JourneyContext.tsx      # Global state management
├── components/
│   ├── FileUpload.tsx          # CSV upload
│   ├── TransportChart.tsx      # Chart component
│   ├── RouteTable.tsx          # Table component
│   └── Dashboard.tsx           # Main dashboard layout
├── hooks/
│   └── useCsvUpload.tsx        # File upload logic
├── types/
│   └── index.ts
├── utils/
│   ├── csvParser.ts
│   ├── distanceCalculator.ts
│   └── dataAggregator.ts
└── App.tsx                     # Provider wrapper


## TYPES

// Raw CSV row
interface CsvRow {
  origin: string;
  originCountry: string;
  destination: string;
  destinationCountry: string;
  weightKg: number;
}

// Processed journey with calculated data
interface Journey {
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
}

interface JourneyLeg {
  mode: TransportMode;
  distance: number;
  weight: number;
}

// Aggregated route data for the table
interface RouteGroup {
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
}
  

## Context API Strategy
- Use React Context for global state
- Single context provider wrapping the entire app at the top level
- Keep raw journey data and computed aggregations in the same context
- Use useMemo for expensive computations (route grouping, chart data)
- Separate hooks from components for cleaner testing and reusability

## Data Processing Pipeline
- Need a clear 3-stage pipeline: Parse → Calculate → Aggregate
- Stage 1: CSV parsing with validation (use Zod for type safety)
- Stage 2: Distance calculation and journey leg splitting 
- Stage 3: Route grouping and weight aggregation
- Each stage should be pure functions for easier testing

## Business Logic Considerations
- Distance threshold: 1500km determines single vs multi-modal transport
- Multi-modal: Road (100km) + Sea (distance-200km) + Road (100km)
- CRITICAL: Avoid double-counting cargo weight in multi-modal journeys
- Same cargo (1000kg) on 3 legs ≠ 3000kg total weight
- Solution: Count weight once per transport MODE, not per leg

## UI/UX Flow
- Simple upload → process → visualize workflow
- Interactive chart showing all routes initially
- Clickable table rows filter chart to specific route
- Clear visual feedback when route is selected vs showing all data
- Use Recharts for charts - good React integration and customization

## Data Validation Strategy
- Validate CSV data immediately after parsing before any processing
- Handle edge cases: negative weights, missing fields, invalid formats
- Use preprocessing to clean data (trim whitespace, convert negatives)
- Fail fast with clear error messages for users

## Performance Considerations
- Use useMemo for expensive route grouping calculations
- Debounce file uploads if needed
- Keep chart data transformations lightweight
- Consider virtualization for large datasets (if CSV has >1000 rows) (NOT NEEDED)

## Testing Strategy
- Focus on business logic: distance calculation, weight aggregation, validation
- Test edge cases: boundary conditions (exactly 1500km), negative weights
- Mock CSV data for consistent test results
- Use Vitest for fast testing with good Vite integration

## State Management Pattern
- Keep derived state in context (processed journeys, route groups)
- Selected route as simple string identifier ("London → Dubai")
- Chart data computed from selected route filter
- Avoid prop drilling by using context consumers

## Error Handling
- Graceful CSV parsing failures with user-friendly messages
- Validation errors should show specific field issues
- File upload errors (wrong format, too large, etc.)
- Network errors if using real distance APIs (future enhancement)

## Table Sorting Strategy
- Default sort: most frequently taken routes first (timesTaken DESC)
- Secondary sort by total weight when frequencies are equal
- Make all columns sortable for flexibility
- Visual indicators for current sort column and direction
- Consider user might want to find specific routes by origin/destination
- Sorting should be client-side for performance (small dataset expected)
- Use simple comparison functions, no need for complex sorting library

## Advanced Validation Strategy
- Use Zod for runtime type checking and data transformation
- Implement preprocessing for data cleaning (negative weights → positive)
- Collect detailed validation errors with row numbers and field specifics
- Support partial success (load valid rows despite some failures)
- Automatic string trimming and type coercion where appropriate
- Handle edge cases: empty strings, null values, invalid formats

## Error Handling Architecture
- Multi-level error boundaries (file upload, data processing, UI state)
- User-friendly error messages with actionable feedback
- Partial success handling for CSV validation (show valid data even if some rows fail)
- Loading states and disabled UI during processing operations
- Clear error display with red styling and appropriate spacing
- Graceful degradation when certain operations fail

## Enhanced UX Patterns
- Interactive chart filtering when table rows are clicked
- Visual selection feedback (blue ring around selected table rows)
- Loading spinners during file processing and data calculations
- Hover effects on interactive elements (buttons, table rows)
- Responsive design patterns for various screen sizes (NOT DONE)
- Clear visual hierarchy with proper typography and spacing

## Development Quality Standards
- ESLint with React-specific rules and strict TypeScript
- Comprehensive JSDoc documentation for all functions
- Unit tests focusing on business logic and edge cases
- Vitest for fast testing with optional UI mode
- No 'any' types - full TypeScript type safety (edge case for zod logic)
- Proper separation of concerns between utils, components, and context

## Performance Optimization Patterns
- Strategic useMemo for expensive computations (route grouping, chart data)
- useCallback for stable function references in custom hooks
- Memoized chart data transformations to prevent unnecessary re-renders
- Efficient React component patterns to minimize re-rendering
- Client-side operations for small datasets (no need for server pagination)

## Options
- Could replace pseudo-distance with real geocoding API (Currently unecessary, too many requests, batching?)
- Consider adding export functionality for processed data
- Multiple file upload and comparison features
- More chart types (pie charts, line charts for trends over time)
