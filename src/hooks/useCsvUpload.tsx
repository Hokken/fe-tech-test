import { useState, useCallback } from 'react';
import { parseCsvFile } from '../utils/csvParser';
import { useJourney } from '../contexts/JourneyContext';

export const useCsvUpload = () => {
  const { loadJourneyData } = useJourney();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const { validRows, errors } = await parseCsvFile(file);
      
      if (validRows.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      // If there are validation errors, show them to the user
      if (errors.length > 0) {
        const errorMessages = errors.slice(0, 3).map(err => 
          `Row ${err.rowIndex}: ${err.errors.map(e => e.message).join(', ')}`
        );
        const errorSummary = `Found ${errors.length} invalid rows. ${errorMessages.join('; ')}${errors.length > 3 ? '...' : ''}`;
        setUploadError(`${errorSummary}. ${validRows.length} valid rows loaded.`);
      }

      await loadJourneyData(validRows);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [loadJourneyData]);

  return {
    handleFileUpload,
    isUploading,
    uploadError
  };
};