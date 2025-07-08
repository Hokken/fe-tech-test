# 🚚 Transport Analytics Dashboard

A TypeScript + React application that processes CSV transport data and provides interactive analytics with multimodal journey visualization.

## 🎯 Overview

This application analyzes transport journey data, calculates distances, splits long journeys into multimodal routes (Road + Sea + Road), and displays interactive charts showing cargo weight distribution across transport modes.

**Key Features:**
- 📊 Interactive chart showing weight by transport mode
- 📋 Sortable route table with clickable filtering
- 📱 Mobile-responsive design with card layouts
- 🔄 Real-time chart updates when selecting routes
- ✅ Comprehensive data validation with error handling
- 🧪 Full test coverage for business logic

---

## 🏗️ Architecture Overview

### **Core Business Logic**

#### **1. Distance Calculation**
Uses a deterministic pseudo-distance algorithm based on city name strings:
```typescript
const fakeDistance = (from: string, to: string): number => {
  const str = from + to;
  return Math.abs([...str].reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 3000 + 100;
};
```

#### **2. Journey Splitting Logic**
- **Distance ≤ 1500km**: Single Road leg
- **Distance > 1500km**: Split into 3 legs:
  - Road (100km) + Sea (distance - 200km) + Road (100km)

#### **3. Weight Distribution** 
**Critical Logic**: Tracks cargo weight by transport mode utilization
- Same 1000kg cargo uses both road and sea transport
- **Road weight**: 1000kg (full cargo handled by road infrastructure)
- **Sea weight**: 1000kg (full cargo handled by sea infrastructure)
- This approach shows total infrastructure utilization per transport mode

### **Data Processing Pipeline**

```
CSV Upload → Zod Validation → Distance Calculation → Journey Splitting → Route Aggregation → Chart Display
```

**Stage 1: Parse & Validate**
- Papa Parse CSV processing
- Zod schema validation with preprocessing
- Handle edge cases (negative weights → positive, missing fields)

**Stage 2: Calculate & Transform**
- Calculate pseudo-distance for each route
- Split journeys based on 1500km threshold
- Apply weight distribution logic per transport mode

**Stage 3: Aggregate & Display**
- Group journeys by origin → destination routes
- Calculate aggregated statistics (times taken, total weight, etc.)
- Generate chart data for visualization

### **Component Architecture**

```
App.tsx (Context Provider)
└── Dashboard.tsx (Main Layout)
    ├── FileUpload.tsx (CSV Processing)
    ├── TransportChart.tsx (Recharts Visualization)
    └── RouteTable.tsx (Interactive Data Table)
```

**State Management**: React Context API with optimized memoization
- Global journey data and route aggregations
- Selected route filtering for chart interaction
- Loading states and error handling

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd fe-tech-test

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### **Available Scripts**

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run tests in watch mode
npm run test:ui      # Run tests with UI interface
npm run test:run     # Run tests once
```

---

## 📊 Usage Guide

### **1. Load Data**
- Click "Choose File" or drag & drop a CSV file
- Sample CSV format:
```csv
origin,originCountry,destination,destinationCountry,weightKg
London,GBR,Dubai,ARE,1200
Paris,FRA,Tokyo,JPN,850
```

### **2. Analyze Results**
- **Chart**: Shows total weight by transport mode (Road vs Sea)
- **Table**: Lists all routes with distance, frequency, and mode information

### **3. Interactive Filtering**
- Click any table row to filter chart to that specific route
- Selected row highlights with blue ring
- Chart automatically scrolls into view (especially helpful on mobile)

### **4. Sort Data**
- Click column headers to sort table data
- Visual indicators show current sort direction (↑/↓)
- Multiple sort criteria supported

---

## 🧪 Testing

The application includes comprehensive test coverage focusing on critical business logic:

### **Test Coverage Areas**
- **Distance Calculator**: Algorithm correctness, boundary conditions (1500km threshold)
- **Weight Aggregation**: Anti-double-counting logic, route grouping
- **Data Validation**: Zod schema validation, edge cases, error handling

### **Running Tests**
```bash
# Run all tests
npm run test

# Run with UI interface
npm run test:ui

# Run specific test file
npm run test -- distanceCalculator.test.ts
```

---

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx    # Main layout container
│   ├── FileUpload.tsx   # CSV upload handling
│   ├── TransportChart.tsx # Recharts visualization
│   └── RouteTable.tsx   # Interactive data table
├── contexts/            # React Context for state management
│   ├── JourneyContext.ts # Type definitions
│   └── JourneyContextProvider.tsx # State provider
├── utils/               # Core business logic
│   ├── csvParser.ts     # CSV parsing with Papa Parse
│   ├── distanceCalculator.ts # Distance & journey splitting
│   └── dataAggregator.ts # Route grouping & weight logic
├── schemas/             # Data validation
│   └── transportRowSchema.ts # Zod validation schema
├── types/               # TypeScript definitions
│   └── index.ts
└── __tests__/           # Test suites
    ├── distanceCalculator.test.ts
    ├── dataAggregator.test.ts
    └── transportRowSchema.test.ts
```

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React 19 + TypeScript | Component-based UI with type safety |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Charts** | Recharts | Interactive data visualization |
| **CSV Processing** | Papa Parse | Robust CSV parsing with type detection |
| **Validation** | Zod | Runtime type checking and data validation |
| **Testing** | Vitest | Fast unit testing with great TypeScript support |
| **Build Tool** | Vite | Fast development and optimized builds |
| **State Management** | React Context | Global state with performance optimization |

---

## 🔧 Development Notes

### **Key Design Decisions**

1. **React Context API**: Global state management with strategic memoization for performance
2. **Zod Validation**: Runtime type safety with automatic data cleaning (negative weights → positive)
3. **Pseudo-Distance**: Deterministic algorithm for consistent results without external API dependencies
4. **Per-Mode Weight Logic**: Industry-standard approach showing total infrastructure utilization per transport mode

### **Performance Optimizations**
- `useMemo` for expensive route grouping calculations
- `useCallback` for stable function references
- Memoized chart data transformations

### **Error Handling**
- Graceful CSV parsing with partial success (load valid rows despite some failures)
- Detailed validation errors with row numbers and field specifics
- User-friendly error messages with actionable feedback
- Loading states and disabled UI during processing

### **Mobile Responsiveness**
- Responsive table that transforms into cards on mobile (<640px)
- Touch-friendly interactions with proper hover states
- Automatic scroll-to-chart when selecting routes on mobile
- Optimized typography and spacing for small screens

---

## 📄 License

This project is part of a technical assessment and is intended for evaluation purposes.