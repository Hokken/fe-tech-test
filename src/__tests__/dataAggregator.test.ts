import { describe, it, expect } from 'vitest'
import { processCsvData, getGlobalWeightByMode } from '../utils/dataAggregator'
import { TransportRow } from '../types'

describe('Data Aggregator', () => {
  describe('processCsvData - Weight Calculation Logic', () => {
    describe('Critical: Avoiding Double-Counting in Multi-Modal Journeys', () => {
      it('should count cargo weight once per transport mode, not per leg', () => {
        // Create test data that will trigger multi-modal transport (>1500km)
        // Using known inputs that produce distances > 1500km
        const csvData: TransportRow[] = [
          {
            origin: 'LongOriginNameThatProducesLargeDistance',
            destination: 'LongDestinationNameThatProducesLargeDistance',
            originCountry: 'Country1',
            destinationCountry: 'Country2',
            weightKg: 1000 // 1000kg cargo
          }
        ]

        const { journeys } = processCsvData(csvData)
        const journey = journeys[0]

        // Verify the journey uses multi-modal transport
        expect(journey.distance).toBeGreaterThan(1500)
        expect(journey.legs).toHaveLength(3) // Road + Sea + Road
        expect(journey.legs[0].mode).toBe('Road')
        expect(journey.legs[1].mode).toBe('Sea')
        expect(journey.legs[2].mode).toBe('Road')

        // CRITICAL TEST: Weight should be counted once per mode, not per leg
        // The 1000kg cargo travels on all 3 legs, but we should count:
        // - 1000kg for Road transport (not 2000kg for 2 road legs)
        // - 1000kg for Sea transport
        expect(journey.totalRoadWeight).toBe(1000) // NOT 2000 (2 road legs × 1000kg)
        expect(journey.totalSeaWeight).toBe(1000)  // Correct: 1000kg for sea transport
        expect(journey.weight).toBe(1000) // Original cargo weight unchanged

        // Total weight by mode should reflect the fix
        const globalWeights = getGlobalWeightByMode(journeys)
        expect(globalWeights.road).toBe(1000) // Road transport handled 1000kg
        expect(globalWeights.sea).toBe(1000)  // Sea transport handled 1000kg
        // Total across modes: 2000kg (not 3000kg if we double-counted)
      })

      it('should handle single-modal journeys correctly (≤1500km)', () => {
        // Create test data that will trigger single-modal transport (≤1500km)
        const csvData: TransportRow[] = [
          {
            origin: 'A', // Short strings produce smaller distances
            destination: 'B',
            originCountry: '',
            destinationCountry: '',
            weightKg: 500
          }
        ]

        const { journeys } = processCsvData(csvData)
        const journey = journeys[0]

        // Verify single-modal transport
        expect(journey.distance).toBeLessThanOrEqual(1500)
        expect(journey.legs).toHaveLength(1)
        expect(journey.legs[0].mode).toBe('Road')

        // Weight should only be counted for road transport
        expect(journey.totalRoadWeight).toBe(500)
        expect(journey.totalSeaWeight).toBe(0) // No sea transport used
        expect(journey.weight).toBe(500)

        const globalWeights = getGlobalWeightByMode(journeys)
        expect(globalWeights.road).toBe(500)
        expect(globalWeights.sea).toBe(0)
      })

      it('should aggregate weights correctly across multiple journeys', () => {
        const csvData: TransportRow[] = [
          // Journey 1: Multi-modal (will be >1500km due to long strings)
          {
            origin: 'VeryLongOriginNameForMultiModal',
            destination: 'VeryLongDestinationNameForMultiModal',
            originCountry: 'US',
            destinationCountry: 'JP',
            weightKg: 1000
          },
          // Journey 2: Single-modal (short strings = <1500km)
          {
            origin: 'X',
            destination: 'Y',
            originCountry: 'US',
            destinationCountry: 'CA',
            weightKg: 500
          },
          // Journey 3: Another multi-modal
          {
            origin: 'AnotherVeryLongOriginName',
            destination: 'AnotherVeryLongDestinationName',
            originCountry: 'UK',
            destinationCountry: 'AU',
            weightKg: 2000
          }
        ]

        const { journeys } = processCsvData(csvData)
        
        // Verify we have the expected journey types
        expect(journeys).toHaveLength(3)
        
        // Let's check what the actual distances are to understand the transport modes
        const journey1 = journeys.find(j => j.route.origin === 'VeryLongOriginNameForMultiModal')!
        const journey2 = journeys.find(j => j.route.origin === 'X')!
        const journey3 = journeys.find(j => j.route.origin === 'AnotherVeryLongOriginName')!
        
        // Calculate expected totals based on actual transport modes used
        let expectedRoad = 0
        let expectedSea = 0
        
        if (journey1.distance > 1500) {
          expectedRoad += 1000
          expectedSea += 1000
        } else {
          expectedRoad += 1000
        }
        
        if (journey2.distance > 1500) {
          expectedRoad += 500
          expectedSea += 500
        } else {
          expectedRoad += 500
        }
        
        if (journey3.distance > 1500) {
          expectedRoad += 2000
          expectedSea += 2000
        } else {
          expectedRoad += 2000
        }
        
        const globalWeights = getGlobalWeightByMode(journeys)
        expect(globalWeights.road).toBe(expectedRoad)
        expect(globalWeights.sea).toBe(expectedSea)
      })
    })

    describe('Route Grouping Logic', () => {
      it('should group journeys by route correctly', () => {
        const csvData: TransportRow[] = [
          // Same route, different weights
          { origin: 'London', destination: 'Paris', originCountry: 'UK', destinationCountry: 'FR', weightKg: 100 },
          { origin: 'London', destination: 'Paris', originCountry: 'UK', destinationCountry: 'FR', weightKg: 200 },
          // Different route
          { origin: 'Madrid', destination: 'Rome', originCountry: 'ES', destinationCountry: 'IT', weightKg: 300 },
        ]

        const { routeGroups } = processCsvData(csvData)
        
        expect(routeGroups).toHaveLength(2) // Two unique routes
        
        // Find the London → Paris route group
        const londonParisGroup = routeGroups.find(rg => rg.routeKey === 'London → Paris')
        expect(londonParisGroup).toBeDefined()
        expect(londonParisGroup!.timesTaken).toBe(2) // Two journeys on this route
        expect(londonParisGroup!.totalWeight).toBe(300) // 100 + 200
        expect(londonParisGroup!.journeys).toHaveLength(2)
        
        // Find the Madrid → Rome route group
        const madridRomeGroup = routeGroups.find(rg => rg.routeKey === 'Madrid → Rome')
        expect(madridRomeGroup).toBeDefined()
        expect(madridRomeGroup!.timesTaken).toBe(1)
        expect(madridRomeGroup!.totalWeight).toBe(300)
        expect(madridRomeGroup!.journeys).toHaveLength(1)
      })

      it('should calculate aggregated statistics correctly', () => {
        const csvData: TransportRow[] = [
          // Two journeys on the same route with known short distance
          { origin: 'A', destination: 'B', originCountry: '', destinationCountry: '', weightKg: 1000 },
          { origin: 'A', destination: 'B', originCountry: '', destinationCountry: '', weightKg: 2000 },
        ]

        const { routeGroups } = processCsvData(csvData)
        const routeGroup = routeGroups[0]
        
        expect(routeGroup.timesTaken).toBe(2)
        expect(routeGroup.totalWeight).toBe(3000) // 1000 + 2000
        expect(routeGroup.totalDistance).toBe(routeGroup.distance * 2) // distance × times taken
        
        // For short distance routes, should be road-only
        expect(routeGroup.totalRoadWeight).toBe(3000) // Both journeys use road
        expect(routeGroup.totalSeaWeight).toBe(0) // No sea transport for short distances
      })
    })
  })

  describe('getGlobalWeightByMode', () => {
    it('should calculate total weight by transport mode correctly', () => {
      // Create mock journeys with known weight distributions
      const journeys = [
        {
          id: '1',
          route: { origin: 'A', destination: 'B', originCountry: '', destinationCountry: '' },
          weight: 1000,
          distance: 500,
          legs: [],
          totalRoadWeight: 1000, // Road-only journey
          totalSeaWeight: 0
        },
        {
          id: '2', 
          route: { origin: 'C', destination: 'D', originCountry: '', destinationCountry: '' },
          weight: 2000,
          distance: 2500,
          legs: [],
          totalRoadWeight: 2000, // Multi-modal journey
          totalSeaWeight: 2000
        }
      ]

      const result = getGlobalWeightByMode(journeys)
      
      expect(result.road).toBe(3000) // 1000 + 2000
      expect(result.sea).toBe(2000)  // 0 + 2000
    })

    it('should round weights for cleaner display', () => {
      const journeys = [
        {
          id: '1',
          route: { origin: 'A', destination: 'B', originCountry: '', destinationCountry: '' },
          weight: 1000.7,
          distance: 500,
          legs: [],
          totalRoadWeight: 1000.7,
          totalSeaWeight: 0
        }
      ]

      const result = getGlobalWeightByMode(journeys)
      
      // Should be rounded
      expect(result.road).toBe(1001) // Math.round(1000.7)
      expect(result.sea).toBe(0)
    })

    it('should handle empty journey array', () => {
      const result = getGlobalWeightByMode([])
      
      expect(result.road).toBe(0)
      expect(result.sea).toBe(0)
    })
  })
})