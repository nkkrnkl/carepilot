"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadDropzoneProps {
  onUploadSuccess?: (reportId: string) => void;
  userId?: string;
}

export function UploadDropzone({ onUploadSuccess, userId = "demo-user" }: UploadDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setStatus({
        success: false,
        message: "Invalid file type. Only PDF, PNG, and JPG are allowed.",
      });
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setStatus({
        success: false,
        message: "File size exceeds 10MB limit.",
      });
      return;
    }

    setSelectedFile(file);
    setStatus(null);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  function handleClear() {
    setSelectedFile(null);
    setStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userId", userId);

      const response = await fetch("/api/labs/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            // Fallback to status text
            errorMessage = response.statusText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setStatus({
        success: true,
        message: "Upload & extraction complete.",
      });

      // Show warning if Pinecone save failed
      if (!data.pineconeSaved) {
        toast.warning("Saved to database, but Pinecone upload failed. Data may not be searchable.");
      }

      // Clear file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(data.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setStatus({
        success: false,
        message: errorMessage,
      });
      if (errorMessage.includes("parse") || errorMessage.includes("Couldn't parse")) {
        toast.error("Couldn't parse this file.");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
      <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Upload PDF</CardTitle>
        <CardDescription>Upload a PDF lab report to extract and analyze</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <label
            htmlFor="file-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-primary/50 bg-muted/30"
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PDF, PNG, or JPG (MAX. 10MB)</p>
            </div>
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleInputChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground truncate flex-1">{selectedFile.name}</span>
            <div className="flex gap-2 ml-2">
              <Button variant="ghost" size="sm" onClick={handleClear} disabled={uploading}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upload & Analyze"
                )}
              </Button>
            </div>
          </div>
        )}

        {status && (
          <div
            className={cn(
              "p-4 rounded-md",
              status.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            )}
          >
            <div className="flex items-center gap-2">
              {status.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <p
                className={cn(
                  "text-sm font-medium",
                  status.success ? "text-green-800" : "text-red-800"
                )}
              >
                {status.message}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

