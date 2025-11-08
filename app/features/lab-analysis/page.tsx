"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDashboardUrl } from '@/lib/navigation';
import { 
  Beaker,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  BarChart3,
  Upload,
  X,
  Loader2
} from "lucide-react";

const capabilities = [
  {
    title: "Parse Common Labs",
    description: "Automatically extract and organize data from lab results, regardless of format or provider.",
    icon: Beaker
  },
  {
    title: "Track Trends & Deltas",
    description: "Monitor changes over time with visual trend analysis and delta calculations between tests.",
    icon: TrendingUp
  },
  {
    title: "Flag Out-of-Range Values",
    description: "Instantly identify values that fall outside normal ranges with clear visual indicators.",
    icon: AlertTriangle
  },
  {
    title: "Plain-English Context",
    description: "Translate medical terminology into understandable language with detailed explanations.",
    icon: MessageSquare
  },
  {
    title: "Suggested Questions",
    description: "Get informed questions to discuss with your clinician based on your lab results.",
    icon: MessageSquare
  },
  {
    title: "Historical Comparisons",
    description: "Compare current results with previous tests to identify patterns and improvements.",
    icon: BarChart3
  }
];

export default function LabAnalysisPage() {
  const dashboardUrl = useDashboardUrl();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    resultsCount?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(null);
    }
  }

  function handleClear() {
    setSelectedFile(null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userId", "default-user"); // In production, get from auth

      console.log("[client] Uploading lab report:", selectedFile.name);

      const res = await fetch("/api/labs/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      console.log("[client] Upload successful:", data);
      setUploadStatus({
        success: true,
        message: data.message || "Lab report uploaded successfully",
        resultsCount: data.resultsCount,
      });

      // Clear file selection
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("[client] Upload error:", error);
      setUploadStatus({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href={dashboardUrl} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Beaker className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Lab Analysis</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href={dashboardUrl}>Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700">Feature</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Lab Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Parse common labs, track trends and deltas, flag out-of-range values with plain-English context 
            and suggested questions for your clinician. Get actionable insights from your lab results with 
            AI-powered analysis that helps you understand your health metrics.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-2 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Upload Lab Report</CardTitle>
            <CardDescription>Upload PDF, PNG, or JPG files to analyze your lab results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
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
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {selectedFile.name}
                </span>
                <div className="flex gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
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

            {uploadStatus && (
              <div
                className={`p-4 rounded-md ${
                  uploadStatus.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {uploadStatus.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        uploadStatus.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {uploadStatus.message}
                    </p>
                    {uploadStatus.success && uploadStatus.resultsCount !== undefined && (
                      <p className="text-xs text-green-600 mt-1">
                        {uploadStatus.resultsCount} lab result{uploadStatus.resultsCount !== 1 ? "s" : ""} extracted
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <Card key={index} className="border-2 hover:border-blue-300 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{capability.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {capability.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <Card className="border-2 border-blue-200 bg-blue-50/50 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Upload Your Lab Results</h3>
                  <p className="text-gray-600">
                    Upload lab results in any format. CarePilot automatically extracts and organizes all relevant data.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Analysis & Context</h3>
                  <p className="text-gray-600">
                    Our AI analyzes your results, identifies trends, flags anomalies, and provides plain-English explanations.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Get Actionable Insights</h3>
                  <p className="text-gray-600">
                    Receive suggested questions for your clinician and track your health metrics over time with visual trends.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="border-2 border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg font-semibold text-gray-900">Important Notice</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              CarePilot's lab analysis is <strong>informational only and not medical advice</strong>. All insights, 
              explanations, and suggested questions are provided to help you better understand your lab results and 
              facilitate discussions with your healthcare provider. Always consult with a qualified clinician for 
              medical decisions and interpretations.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

