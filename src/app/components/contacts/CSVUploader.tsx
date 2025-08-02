"use client";

import React, { useState } from "react";

interface ImportResult {
  totalRows: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: Array<{
    row: Record<string, string>;
    reason: string;
  }>;
}

interface CSVUploaderProps {
  onClose: () => void;
  onImportComplete?: () => void;
}

export function CSVUploader({ onClose, onImportComplete }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (
      selectedFile &&
      (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv"))
    ) {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert("Please select a valid CSV file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file first");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/csvParser", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      setImportResult(result.results);

      if (result.results.failed === 0) {
        alert(`Successfully imported ${result.results.successful} contacts!`);
      } else {
        alert(
          `Import completed: ${result.results.successful} successful, ${result.results.failed} failed, ${result.results.duplicates} duplicates`
        );
      }

      // Reset file input
      setFile(null);
      const fileInput = document.getElementById("csv-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Call the callback to refresh the contacts list
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Error uploading file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Import Contacts from CSV
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close dialog"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* CSV Format Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                CSV Format Requirements:
              </h4>
              <p className="text-sm text-blue-700 mb-2">
                Your CSV file should include these columns:{" "}
                <strong>name</strong>, <strong>email</strong>, phone, company,
                notes, tags
              </p>
              <p className="text-xs text-blue-600">
                • Name and email are required
                <br />
                • Tags should be separated by semicolons (e.g.,
                &quot;lead;vip;prospect&quot;)
                <br />• Sample: name,email,phone,company,notes,tags
              </p>
            </div>

            {/* File Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
                isDragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {file ? (
                <div className="space-y-3">
                  <svg
                    className="mx-auto h-12 w-12 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">
                        Drop your CSV file here
                      </span>{" "}
                      or{" "}
                      <label className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                        browse to select
                        <input
                          id="csv-file"
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      CSV files only (max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-3">
                  Import Results
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p>
                      Total rows:{" "}
                      <span className="font-medium">
                        {importResult.totalRows}
                      </span>
                    </p>
                    <p className="text-green-600">
                      Successful:{" "}
                      <span className="font-medium">
                        {importResult.successful}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    {importResult.duplicates > 0 && (
                      <p className="text-yellow-600">
                        Duplicates:{" "}
                        <span className="font-medium">
                          {importResult.duplicates}
                        </span>
                      </p>
                    )}
                    {importResult.failed > 0 && (
                      <p className="text-red-600">
                        Failed:{" "}
                        <span className="font-medium">
                          {importResult.failed}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      View Error Details ({importResult.errors.length})
                    </summary>
                    <div className="mt-2 max-h-32 overflow-y-auto bg-white rounded border p-2">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <div
                          key={index}
                          className="text-xs text-red-600 py-1 border-b border-gray-100 last:border-b-0"
                        >
                          <strong>Row {index + 1}:</strong> {error.reason}
                        </div>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p className="text-xs text-gray-500 pt-1">
                          ...and {importResult.errors.length - 5} more errors
                        </p>
                      )}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? "Importing..." : "Import Contacts"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
