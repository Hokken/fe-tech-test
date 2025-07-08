/* eslint-disable @typescript-eslint/no-explicit-any */
import Papa from 'papaparse';
import { TransportRowSchema, TransportRow, ValidationError } from '../schemas/transportRowSchema';

/**
 * Result type for CSV parsing operations.
 * Contains both successfully validated rows and detailed error information.
 */
export type CsvParseResult = {
  validRows: TransportRow[];    // Array of rows that passed Zod validation
  errors: ValidationError[];    // Array of validation errors with row numbers
};

/**
 * Parses a CSV file and validates each row using Zod schema validation.
 * This function combines Papa Parse for CSV parsing with Zod for data validation.
 * 
 * Process:
 * 1. Use Papa Parse to convert CSV file to JavaScript objects
 * 2. Validate each row against our Zod schema
 * 3. Collect valid rows and detailed error information
 * 4. Return both for proper error handling and user feedback
 * 
 * @param file - CSV file from user upload
 * @returns Promise resolving to CsvParseResult with valid data and errors
 */
export const parseCsvFile = (file: File): Promise<CsvParseResult> => {
  return new Promise((resolve, reject) => {
    /**
     * Configure Papa Parse for optimal CSV processing:
     * - header: true - Use first row as object keys
     * - dynamicTyping: true - Automatically convert strings to numbers where possible
     * - skipEmptyLines: true - Ignore completely empty rows
     */
    Papa.parse<any>(file, {
      header: true,           // Convert CSV to objects using first row as keys
      dynamicTyping: true,    // Auto-convert "123" to 123, "true" to true, etc.
      skipEmptyLines: true,   // Skip rows that are completely empty

      /**
       * Success callback - called when Papa Parse successfully reads the CSV
       * @param result - Papa Parse result containing data and metadata
       */
      complete: (result: Papa.ParseResult<any>) => {
        try {
          // Arrays to collect validation results
          const validRows: TransportRow[] = [];      // Successfully validated rows
          const errors: ValidationError[] = [];      // Validation failures with details

          /**
           * Validate each CSV row using our Zod schema.
           * This is where we eliminate 'any' types and ensure data quality.
           */
          result.data.forEach((row, index) => {
            /**
             * Use Zod's safeParse for validation without throwing errors.
             * This allows us to collect all validation errors rather than
             * stopping at the first failure.
             * 
             * safeParse returns:
             * - { success: true, data: ValidatedData } if validation passes
             * - { success: false, error: ZodError } if validation fails
             */
            const parseResult = TransportRowSchema.safeParse(row);

            if (parseResult.success) {
              // Validation succeeded - add the cleaned/validated data
              validRows.push(parseResult.data);
            } else {
              // Validation failed - collect error details for user feedback
              errors.push({
                rowIndex: index + 1,              // 1-based numbering for user display
                errors: parseResult.error.issues  // Detailed Zod validation errors
              });
            }
          });

          // Return both valid data and error information
          // This allows the UI to show partial success with error details
          resolve({ validRows, errors });

        } catch {
          // Handle unexpected errors during validation processing
          reject(new Error('Failed to parse CSV data'));
        }
      },

      /**
       * Error callback - called if Papa Parse encounters CSV parsing errors
       * (e.g., malformed CSV file, file read errors)
       */
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};
