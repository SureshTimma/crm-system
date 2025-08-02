"use client";

import React, { useState } from "react";

export function CSVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/api/csvParser", formData);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData); // Debug log
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      alert(`Successfully processed ${result.count} rows`);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById("csv-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
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
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="text-lg font-medium mb-4">Upload CSV File</h3>

      <div className="mb-4">
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {file && (
        <div className="mb-4 text-sm text-gray-600">
          Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>
    </div>
  );
}
