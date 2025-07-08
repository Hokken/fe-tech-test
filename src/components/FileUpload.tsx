import { ChangeEvent } from 'react';
import { useCsvUpload } from '../hooks/useCsvUpload';

export function FileUpload() {
  const { handleFileUpload, isUploading, uploadError } = useCsvUpload();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Load Journey Data</h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Choose CSV File:</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          disabled={isUploading}
        />
      </div>

      {uploadError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {uploadError}
        </div>
      )}

      <p className="mt-4 text-sm text-gray-600">
        Upload a CSV file with columns: origin, originCountry, destination, destinationCountry, weightKg
      </p>
    </div>
  );
}