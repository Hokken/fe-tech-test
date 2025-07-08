import { z } from 'zod';

/**
 * Zod validation schema for CSV transport data rows.
 * This schema provides runtime type checking and data transformation for incoming CSV data.
 * 
 * Benefits:
 * - Eliminates 'any' types from Papa Parse
 * - Provides detailed validation error messages
 * - Automatically cleans and transforms data
 * - Generates TypeScript types from the schema
 */
export const TransportRowSchema = z.object({
  /**
   * Origin location (required field)
   * - Automatically trims whitespace
   * - Must have at least 1 character after trimming
   * - Provides clear error message if missing
   */
  origin: z.string().trim().min(1, "Origin is required"),

  /**
   * Origin country (optional field)
   * - Automatically trims whitespace
   * - Defaults to empty string if not provided
   * - Handles missing or null values gracefully
   */
  originCountry: z.string().trim().default(''),

  /**
   * Destination location (required field)
   * - Automatically trims whitespace
   * - Must have at least 1 character after trimming
   * - Provides clear error message if missing
   */
  destination: z.string().trim().min(1, "Destination is required"),

  /**
   * Destination country (optional field)
   * - Automatically trims whitespace
   * - Defaults to empty string if not provided
   * - Handles missing or null values gracefully
   */
  destinationCountry: z.string().trim().default(''),

  /**
   * Weight in kilograms (complex validation with preprocessing)
   * 
   * Two-stage validation process:
   * 1. Preprocessing: Clean and transform the input value
   * 2. Validation: Ensure the result is a positive number
   */
  weightKg: z.preprocess(
    (val) => {
      /**
       * Preprocessing function that handles various input formats:
       * - Converts any input to string first (handles numbers, null, undefined)
       * - Attempts to parse as float (handles "123.45", "123", etc.)
       * - Applies Math.abs() to handle negative weights automatically
       * - Returns original value if parsing fails (for proper error message)
       * 
       * Examples:
       * - "123.45" → 123.45
       * - "-50" → 50 (negative converted to positive)
       * - "abc" → "abc" (passed through for validation error)
       * - null → "null" → NaN → "null" (passed through for validation error)
       */
      const num = parseFloat(String(val));
      
      // If parsing succeeded, apply abs transformation and return number
      // If parsing failed (NaN), return original value for proper error handling
      return isNaN(num) ? val : Math.abs(num);
    },
    // Second stage: validate that the preprocessed value is a positive number
    z.number().positive("Weight must be a positive number")
  ),
});

/**
 * TypeScript type automatically inferred from the Zod schema.
 * This ensures that our TypeScript types exactly match our runtime validation.
 * 
 * Resulting type structure:
 * {
 *   origin: string;           // Required, trimmed, non-empty
 *   originCountry: string;    // Optional, trimmed, defaults to ""
 *   destination: string;      // Required, trimmed, non-empty
 *   destinationCountry: string; // Optional, trimmed, defaults to ""
 *   weightKg: number;         // Required, positive number
 * }
 */
export type TransportRow = z.infer<typeof TransportRowSchema>;

/**
 * Type definition for validation errors during CSV processing.
 * Used to collect and display detailed error information to users.
 * 
 * Structure allows for:
 * - Tracking which row number failed validation (1-based for user display)
 * - Including all Zod validation issues for that row
 * - Providing specific error messages for each field that failed
 */
export type ValidationError = {
  rowIndex: number;       // 1-based row number for user-friendly error messages
  errors: z.ZodIssue[];   // Array of specific validation failures from Zod
};