import { describe, it, expect } from 'vitest'
import { TransportRowSchema } from '../schemas/transportRowSchema'

describe('TransportRowSchema Validation', () => {
  describe('Valid Data Cases', () => {
    it('should accept valid complete data', () => {
      const validData = {
        origin: 'London',
        originCountry: 'United Kingdom',
        destination: 'Dubai',
        destinationCountry: 'United Arab Emirates',
        weightKg: 1500
      }

      const result = TransportRowSchema.safeParse(validData)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should accept data with optional country fields missing', () => {
      const validData = {
        origin: 'Paris',
        destination: 'Rome',
        weightKg: 2000
      }

      const result = TransportRowSchema.safeParse(validData)
      
      expect(result.success).toBe(true)
      if (result.success) {
        // Should fill in default empty strings for missing countries
        expect(result.data.originCountry).toBe('')
        expect(result.data.destinationCountry).toBe('')
        expect(result.data.origin).toBe('Paris')
        expect(result.data.destination).toBe('Rome')
        expect(result.data.weightKg).toBe(2000)
      }
    })

    it('should trim whitespace from string fields', () => {
      const dataWithWhitespace = {
        origin: '  London  ',
        originCountry: '  United Kingdom  ',
        destination: '  Dubai  ',
        destinationCountry: '  UAE  ',
        weightKg: 1000
      }

      const result = TransportRowSchema.safeParse(dataWithWhitespace)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.origin).toBe('London')
        expect(result.data.originCountry).toBe('United Kingdom')
        expect(result.data.destination).toBe('Dubai')
        expect(result.data.destinationCountry).toBe('UAE')
      }
    })

    it('should convert negative weights to positive', () => {
      const dataWithNegativeWeight = {
        origin: 'Madrid',
        destination: 'Barcelona',
        weightKg: -500 // Negative weight should be converted to positive
      }

      const result = TransportRowSchema.safeParse(dataWithNegativeWeight)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.weightKg).toBe(500) // Should be positive
      }
    })

    it('should handle string numbers for weight', () => {
      const dataWithStringWeight = {
        origin: 'Tokyo',
        destination: 'Osaka',
        weightKg: '1234.56' // String number should be converted
      }

      const result = TransportRowSchema.safeParse(dataWithStringWeight)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.weightKg).toBe(1234.56)
      }
    })

    it('should handle string negative numbers for weight', () => {
      const dataWithStringNegativeWeight = {
        origin: 'Sydney',
        destination: 'Melbourne',
        weightKg: '-789.12' // String negative should be converted to positive
      }

      const result = TransportRowSchema.safeParse(dataWithStringNegativeWeight)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.weightKg).toBe(789.12) // Should be positive
      }
    })
  })

  describe('Invalid Data Cases', () => {
    describe('Missing Required Fields', () => {
      it('should reject data with missing origin', () => {
        const invalidData = {
          destination: 'Dubai',
          weightKg: 1000
          // origin is missing
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1)
          expect(result.error.issues[0].path).toEqual(['origin'])
        }
      })

      it('should reject data with missing destination', () => {
        const invalidData = {
          origin: 'London',
          weightKg: 1000
          // destination is missing
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1)
          expect(result.error.issues[0].path).toEqual(['destination'])
        }
      })

      it('should reject data with missing weight', () => {
        const invalidData = {
          origin: 'London',
          destination: 'Dubai'
          // weightKg is missing
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1)
          expect(result.error.issues[0].path).toEqual(['weightKg'])
        }
      })
    })

    describe('Empty Required Fields', () => {
      it('should reject empty origin after trimming', () => {
        const invalidData = {
          origin: '   ', // Only whitespace
          destination: 'Dubai',
          weightKg: 1000
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Origin is required')
        }
      })

      it('should reject empty destination after trimming', () => {
        const invalidData = {
          origin: 'London',
          destination: '', // Empty string
          weightKg: 1000
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Destination is required')
        }
      })
    })

    describe('Invalid Weight Values', () => {
      it('should reject non-numeric weight strings', () => {
        const invalidData = {
          origin: 'London',
          destination: 'Dubai',
          weightKg: 'not a number'
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Expected number, received string')
        }
      })

      it('should reject zero weight', () => {
        const invalidData = {
          origin: 'London',
          destination: 'Dubai',
          weightKg: 0
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Weight must be a positive number')
        }
      })

      it('should reject null weight', () => {
        const invalidData = {
          origin: 'London',
          destination: 'Dubai',
          weightKg: null
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Expected number, received null')
        }
      })

      it('should reject undefined weight', () => {
        const invalidData = {
          origin: 'London',
          destination: 'Dubai',
          weightKg: undefined
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Required')
        }
      })
    })

    describe('Multiple Validation Errors', () => {
      it('should collect all validation errors for completely invalid data', () => {
        const invalidData = {
          origin: '', // Empty
          destination: '   ', // Only whitespace
          weightKg: 'invalid weight' // Non-numeric
          // Missing countries should not cause errors (they have defaults)
        }

        const result = TransportRowSchema.safeParse(invalidData)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          // Should have errors for origin, destination, and weight
          expect(result.error.issues).toHaveLength(3)
          
          const errorPaths = result.error.issues.map(issue => issue.path[0])
          expect(errorPaths).toContain('origin')
          expect(errorPaths).toContain('destination')
          expect(errorPaths).toContain('weightKg')
        }
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large weights', () => {
      const dataWithLargeWeight = {
        origin: 'Shanghai',
        destination: 'Los Angeles',
        weightKg: 999999999 // Very large number
      }

      const result = TransportRowSchema.safeParse(dataWithLargeWeight)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.weightKg).toBe(999999999)
      }
    })

    it('should handle decimal weights', () => {
      const dataWithDecimalWeight = {
        origin: 'Berlin',
        destination: 'Vienna',
        weightKg: 1234.5678
      }

      const result = TransportRowSchema.safeParse(dataWithDecimalWeight)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.weightKg).toBe(1234.5678)
      }
    })

    it('should handle special characters in city names', () => {
      const dataWithSpecialChars = {
        origin: 'São Paulo',
        destination: 'Zürich',
        weightKg: 1000
      }

      const result = TransportRowSchema.safeParse(dataWithSpecialChars)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.origin).toBe('São Paulo')
        expect(result.data.destination).toBe('Zürich')
      }
    })

    it('should handle very long city names', () => {
      const dataWithLongNames = {
        origin: 'A'.repeat(1000), // Very long city name
        destination: 'B'.repeat(1000),
        weightKg: 500
      }

      const result = TransportRowSchema.safeParse(dataWithLongNames)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.origin).toBe('A'.repeat(1000))
        expect(result.data.destination).toBe('B'.repeat(1000))
      }
    })
  })
})