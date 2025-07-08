import { describe, it, expect } from 'vitest'
import { fakeDistance, calculateJourneyLegs, getTransportModesString } from '../utils/distanceCalculator'

describe('Distance Calculator', () => {
  describe('fakeDistance', () => {
    it('should return consistent distances for same origin-destination pairs', () => {
      // Test deterministic behavior - same inputs always produce same outputs
      const distance1 = fakeDistance('London', 'Dubai')
      const distance2 = fakeDistance('London', 'Dubai')
      const distance3 = fakeDistance('London', 'Dubai')
      
      expect(distance1).toBe(distance2)
      expect(distance2).toBe(distance3)
    })

    it('should return different distances for different routes', () => {
      // Different routes should produce different distances
      const londonDubai = fakeDistance('London', 'Dubai')
      const parisRome = fakeDistance('Paris', 'Rome')
      const newYorkTokyo = fakeDistance('New York', 'Tokyo')
      
      expect(londonDubai).not.toBe(parisRome)
      expect(parisRome).not.toBe(newYorkTokyo)
      expect(londonDubai).not.toBe(newYorkTokyo)
    })

    it('should return distances within specified range (100-3099km)', () => {
      // Test various route combinations to ensure they all fall within the expected range
      const testRoutes = [
        ['London', 'Dubai'],
        ['Paris', 'Rome'],
        ['New York', 'Tokyo'],
        ['A', 'B'], // Short strings
        ['VeryLongCityNameTest', 'AnotherVeryLongDestinationName'], // Long strings
        ['', 'Dubai'], // Edge case: empty origin
        ['London', ''], // Edge case: empty destination
      ]

      testRoutes.forEach(([origin, destination]) => {
        const distance = fakeDistance(origin, destination)
        expect(distance).toBeGreaterThanOrEqual(100)
        expect(distance).toBeLessThan(3100) // 3000 + 100 = 3100 max
      })
    })

    it('should handle special characters and numbers in city names', () => {
      // Test edge cases with special characters
      const distance1 = fakeDistance('São Paulo', 'New York')
      const distance2 = fakeDistance('City-123', 'Destination#456')
      
      expect(distance1).toBeGreaterThanOrEqual(100)
      expect(distance1).toBeLessThan(3100)
      expect(distance2).toBeGreaterThanOrEqual(100)
      expect(distance2).toBeLessThan(3100)
    })
  })

  describe('calculateJourneyLegs', () => {
    describe('Short distances (≤ 1500km) - Single Road leg', () => {
      it('should create single road leg for distances ≤ 1500km', () => {
        const testCases = [
          { distance: 100, weight: 1000 },
          { distance: 500, weight: 2500 },
          { distance: 1500, weight: 1200 }, // Boundary case: exactly 1500km
        ]

        testCases.forEach(({ distance, weight }) => {
          const legs = calculateJourneyLegs(distance, weight)
          
          expect(legs).toHaveLength(1)
          expect(legs[0]).toEqual({
            mode: 'Road',
            distance: distance,
            weight: weight
          })
        })
      })
    })

    describe('Long distances (> 1500km) - Multi-modal transport', () => {
      it('should create multi-modal journey for distances > 1500km', () => {
        // Test case: 2500km journey with 1000kg cargo
        const legs = calculateJourneyLegs(2500, 1000)
        
        expect(legs).toHaveLength(3)
        
        // First leg: Road (100km)
        expect(legs[0]).toEqual({
          mode: 'Road',
          distance: 100,
          weight: 1000
        })
        
        // Second leg: Sea (2500 - 200 = 2300km)
        expect(legs[1]).toEqual({
          mode: 'Sea',
          distance: 2300, // 2500 - 200 (2x 100km road legs)
          weight: 1000
        })
        
        // Third leg: Road (100km)
        expect(legs[2]).toEqual({
          mode: 'Road',
          distance: 100,
          weight: 1000
        })
      })

      it('should correctly calculate sea distance for various long distances', () => {
        const testCases = [
          { totalDistance: 1501, expectedSeaDistance: 1301 }, // Just over threshold
          { totalDistance: 2000, expectedSeaDistance: 1800 },
          { totalDistance: 3000, expectedSeaDistance: 2800 },
        ]

        testCases.forEach(({ totalDistance, expectedSeaDistance }) => {
          const legs = calculateJourneyLegs(totalDistance, 500)
          
          expect(legs).toHaveLength(3)
          expect(legs[1].mode).toBe('Sea')
          expect(legs[1].distance).toBe(expectedSeaDistance)
        })
      })

      it('should apply same weight to all legs in multi-modal journey', () => {
        // This is important for weight distribution logic
        const weight = 1500
        const legs = calculateJourneyLegs(2000, weight)
        
        legs.forEach(leg => {
          expect(leg.weight).toBe(weight)
        })
      })
    })

    describe('Boundary conditions', () => {
      it('should handle the exact 1500km threshold correctly', () => {
        // 1500km should be single road leg (≤ 1500)
        const legs1500 = calculateJourneyLegs(1500, 1000)
        expect(legs1500).toHaveLength(1)
        expect(legs1500[0].mode).toBe('Road')
        
        // 1501km should be multi-modal (> 1500)
        const legs1501 = calculateJourneyLegs(1501, 1000)
        expect(legs1501).toHaveLength(3)
        expect(legs1501[0].mode).toBe('Road')
        expect(legs1501[1].mode).toBe('Sea')
        expect(legs1501[2].mode).toBe('Road')
      })

      it('should handle minimum and maximum distances correctly', () => {
        // Minimum distance (100km)
        const minLegs = calculateJourneyLegs(100, 500)
        expect(minLegs).toHaveLength(1)
        expect(minLegs[0].distance).toBe(100)
        
        // Very large distance
        const maxLegs = calculateJourneyLegs(3000, 500)
        expect(maxLegs).toHaveLength(3)
        expect(maxLegs[1].distance).toBe(2800) // 3000 - 200
      })
    })
  })

  describe('getTransportModesString', () => {
    it('should format single mode correctly', () => {
      const singleLeg = [{ mode: 'Road' as const, distance: 500, weight: 1000 }]
      const result = getTransportModesString(singleLeg)
      expect(result).toBe('Road')
    })

    it('should format multi-modal transport correctly', () => {
      const multiLeg = [
        { mode: 'Road' as const, distance: 100, weight: 1000 },
        { mode: 'Sea' as const, distance: 1800, weight: 1000 },
        { mode: 'Road' as const, distance: 100, weight: 1000 }
      ]
      const result = getTransportModesString(multiLeg)
      expect(result).toBe('Road + Sea + Road')
    })

    it('should handle empty legs array', () => {
      const result = getTransportModesString([])
      expect(result).toBe('')
    })
  })
})