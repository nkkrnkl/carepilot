"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UploadedFile {
  id: string;
  file: File;
  type: "plan_document" | "clinical_note" | "bill" | "lab_report" | "eob";
  status: "uploading" | "success" | "error";
  error?: string;
}

interface DocumentUploadProps {
  userId: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
}

const DOCUMENT_TYPES = [
  { value: "plan_document", label: "Insurance Plan Document", description: "Your insurance benefits and coverage information" },
  { value: "clinical_note", label: "Clinical Note", description: "Medical visit notes or treatment records" },
  { value: "bill", label: "Medical Bill", description: "Bills or invoices from healthcare providers" },
  { value: "lab_report", label: "Lab Report", description: "Laboratory test results" },
  { value: "eob", label: "Explanation of Benefits (EOB)", description: "EOB documents from insurance" },
] as const;

export function DocumentUpload({ userId, onUploadComplete }: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

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
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      type: "plan_document" as const, // Default, user can change
      status: "uploading" as const,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Upload each file
    for (const fileData of newFiles) {
      await uploadFile(fileData);
    }
  };

  const uploadFile = async (fileData: UploadedFile) => {
    try {
      const formData = new FormData();
      formData.append("file", fileData.file);
      formData.append("userId", userId);
      formData.append("docType", fileData.type);
      formData.append("docId", fileData.id);

      const response = await fetch("/api/claims/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? { ...f, status: "success" as const }
            : f
        )
      );

      if (onUploadComplete) {
        onUploadComplete(uploadedFiles.filter((f) => f.status === "success"));
      }
    } catch (error) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? { ...f, status: "error" as const, error: error instanceof Error ? error.message : "Upload failed" }
            : f
        )
      );
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileType = (id: string, type: UploadedFile["type"]) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, type } : f))
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Upload your insurance plan documents, clinical notes, bills, and other medical documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-purple-500 bg-purple-50"
              : "border-gray-300 hover:border-purple-300"
          }`}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">
            Drag and drop files here, or click to select
          </p>
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            onChange={handleFileInput}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            Select Files
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Supported: PDF, DOC, DOCX, TXT, Images
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
                <FileText className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileData.file.size / 1024).toFixed(2)} KB
                  </p>
                </div>

                {/* Document Type Selector */}
                <select
                  value={fileData.type}
                  onChange={(e) =>
                    updateFileType(fileData.id, e.target.value as UploadedFile["type"])
                  }
                  className="text-xs border rounded px-2 py-1"
                  disabled={fileData.status === "uploading"}
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                {/* Status Indicator */}
                {fileData.status === "uploading" && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    <span className="text-xs">Uploading...</span>
                  </div>
                )}
                {fileData.status === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {fileData.status === "error" && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-xs text-red-600">{fileData.error}</span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileData.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Document Type Info */}
        <div className="pt-4 border-t">
          <p className="text-xs font-semibold text-gray-700 mb-2">Document Types:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {DOCUMENT_TYPES.map((type) => (
              <div key={type.value} className="text-xs text-gray-600">
                <Badge variant="outline" className="mr-2">
                  {type.label}
                </Badge>
                <span>{type.description}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

