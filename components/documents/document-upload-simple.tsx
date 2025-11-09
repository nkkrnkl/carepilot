"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface UploadedFile {
  id: string;
  file: File;
  type: "plan_document" | "lab_report" | "eob";
  status: "pending" | "uploading" | "extracting" | "success" | "error";
  error?: string;
  chunkCount?: number;
  eobExtracted?: boolean;
  eobError?: string;
}

interface DocumentUploadSimpleProps {
  userId?: string;
  onUploadComplete?: (file: UploadedFile) => void;
  defaultDocType?: "plan_document" | "lab_report" | "eob";
  showDocTypeSelector?: boolean;
  title?: string;
  description?: string;
}

const DOCUMENT_TYPES = [
  { 
    value: "plan_document" as const, 
    label: "Insurance Plan Document", 
    description: "Your insurance benefits and coverage information" 
  },
  { 
    value: "lab_report" as const, 
    label: "Lab Report", 
    description: "Laboratory test results" 
  },
  { 
    value: "eob" as const, 
    label: "Explanation of Benefits (EOB)", 
    description: "EOB documents from insurance" 
  },
] as const;

export function DocumentUploadSimple({ 
  userId = "user-123", 
  onUploadComplete,
  defaultDocType = "plan_document",
  showDocTypeSelector = true,
  title = "Upload PDF Documents",
  description = "Upload PDF documents to be chunked, embedded, and stored in the vector database"
}: DocumentUploadSimpleProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<"plan_document" | "lab_report" | "eob">(defaultDocType);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [selectedType]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    // Filter for PDF files only
    const pdfFiles = files.filter(file => 
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      alert("Please upload PDF files only");
      return;
    }

    const newFiles: UploadedFile[] = pdfFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      type: selectedType,
      status: "pending" as const,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Upload each file
    for (const fileData of newFiles) {
      await uploadFile(fileData);
    }
  };

  const uploadFile = async (fileData: UploadedFile) => {
    // Update status to uploading
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === fileData.id ? { ...f, status: "uploading" as const } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", fileData.file);
      formData.append("userId", userId);
      formData.append("docType", fileData.type);
      formData.append("docId", fileData.id);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      // Prepare the updated file data for state and callback
      const updatedFileData: UploadedFile = {
        ...fileData,
        status: "success" as const,
        chunkCount: result.chunkCount,
        eobExtracted: fileData.type === "eob" && result.eobExtraction ? result.eobExtraction.success : undefined,
        eobError: fileData.type === "eob" && result.eobExtraction && !result.eobExtraction.success 
          ? result.eobExtraction.error || "EOB extraction failed" 
          : undefined,
      };

      // Update state
      if (fileData.type === "eob" && result.eobExtraction) {
        if (result.eobExtraction.success) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id ? updatedFileData : f
            )
          );
        } else {
          // EOB extraction failed but upload succeeded
      setUploadedFiles((prev) =>
        prev.map((f) =>
              f.id === fileData.id ? updatedFileData : f
            )
          );
        }
      } else {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id ? updatedFileData : f
        )
      );
      }

      // Call onUploadComplete callback with the completed file data
      if (onUploadComplete) {
        onUploadComplete({
          ...updatedFileData,
          id: result.docId || fileData.id, // Use docId from result if available
          fileName: fileData.file.name, // Explicitly include filename for mock data detection
        });
      }
    } catch (error) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? { 
                ...f, 
                status: "error" as const, 
                error: error instanceof Error ? error.message : "Upload failed" 
              }
            : f
        )
      );
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Type Selector */}
        {showDocTypeSelector && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Document Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            {DOCUMENT_TYPES.find(t => t.value === selectedType)?.description}
          </p>
        </div>
        )}

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-300"
          }`}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">
            Drag and drop PDF files here, or click to select
          </p>
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,application/pdf"
            onChange={handleFileInput}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            Select PDF Files
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Only PDF files are supported
          </p>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-700">Uploaded Files</h3>
            {uploadedFiles.map((fileData) => (
              <div
                key={fileData.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
              >
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileData.file.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{(fileData.file.size / 1024).toFixed(2)} KB</span>
                    <span>•</span>
                    <span className="capitalize">{fileData.type.replace("_", " ")}</span>
                    {fileData.chunkCount && (
                      <>
                        <span>•</span>
                        <span>{fileData.chunkCount} chunk{fileData.chunkCount !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                {fileData.status === "pending" && (
                  <span className="text-xs text-gray-500">Pending</span>
                )}
                {fileData.status === "uploading" && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Uploading...</span>
                  </div>
                )}
                {fileData.status === "extracting" && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Extracting EOB...</span>
                  </div>
                )}
                {fileData.status === "success" && (
                  <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                      <span className="text-xs">Uploaded</span>
                    </div>
                    {fileData.type === "eob" && fileData.eobExtracted === true && (
                      <span className="text-xs text-green-600">✓ EOB extracted</span>
                    )}
                    {fileData.type === "eob" && fileData.eobExtracted === false && fileData.eobError && (
                      <span className="text-xs text-yellow-600" title={fileData.eobError}>
                        ⚠ EOB extraction failed
                      </span>
                    )}
                  </div>
                )}
                {fileData.status === "error" && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-xs">{fileData.error}</span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileData.id)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                  disabled={fileData.status === "uploading"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

