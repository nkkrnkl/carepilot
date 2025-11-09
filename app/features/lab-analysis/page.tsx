"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploadSimple } from "@/components/documents/document-upload-simple";
import { PreviousReports } from "@/components/labs/PreviousReports";
import { CurrentDataCards } from "@/components/labs/CurrentDataCards";
import { PastVisitsCharts } from "@/components/labs/PastVisitsCharts";
import { LabCards, LabRow } from "@/components/labs/LabCards";
import { getMockLabData } from "@/lib/labs/mock-lab-data";
import { Toaster, toast } from "sonner";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDashboardUrl } from '@/lib/navigation';

interface LabReport {
  id: string;
  title: string;
  date: string;
  hospital: string | null;
  doctor: string | null;
  parameters: Record<string, { value: string | number; unit?: string | null; referenceRange?: string | null }>;
}

export default function LabsPage() {
  const { user } = useUser();
  const dashboardUrl = useDashboardUrl();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mockLabData, setMockLabData] = useState<LabRow[] | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; fileName: string; date: string; data: LabRow[] | null }>>([]);
  const userId = user?.email || "demo-user"; // Use authenticated user email, fallback to demo

  // Load report when selectedReportId changes
  useEffect(() => {
    if (selectedReportId) {
      // Check if this is an uploaded file (mock data)
      const uploadedFile = uploadedFiles.find(f => f.id === selectedReportId);
      if (uploadedFile) {
        const mockData = getMockLabData(uploadedFile.fileName);
        if (mockData) {
          setMockLabData(mockData);
          setUploadedFileName(uploadedFile.fileName);
          setSelectedReport(null); // Clear database report
          return;
        }
      }
      
      // Otherwise, load from database
      loadReport(selectedReportId);
    } else {
      setSelectedReport(null);
      setMockLabData(null);
      setUploadedFileName(null);
    }
  }, [selectedReportId, userId, uploadedFiles]);

  async function loadReport(reportId: string) {
    try {
      setLoading(true);
      // Clear mock data when loading from database
      setMockLabData(null);
      setUploadedFileName(null);
      
      const response = await fetch(`/api/labs/get?id=${reportId}&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        // The API returns { success: true, report: {...} }
        setSelectedReport(data.report || data);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to load report" }));
        toast.error(errorData.error || "Failed to load report");
      }
    } catch (error) {
      console.error("Failed to load report:", error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  function handleUploadSuccess(file: any) {
    // Extract report ID and filename from uploaded file
    const reportId = file.id || file.docId;
    // Try multiple ways to get the filename (prioritize explicit fileName, then file.name, then file.file.name)
    const fileName = file.fileName || file.file?.name || file.name || "";
    
    setUploadedFileName(fileName);
    
    // Check if this is one of our mock PDFs
    const mockData = getMockLabData(fileName);
    
    // Add to uploaded files list with data
    const fileId = reportId || file.id || `file-${Date.now()}`;
    setUploadedFiles((prev) => {
      // Check if file already exists
      if (prev.some(f => f.id === fileId || f.fileName === fileName)) {
        return prev;
      }
      return [...prev, {
        id: fileId,
        fileName: fileName,
        date: new Date().toISOString(),
        data: mockData // Store the mock data with the file
      }];
    });
    
    if (mockData) {
      setMockLabData(mockData);
      setSelectedReportId(fileId); // Select this file
      toast.success("Lab report uploaded and processed successfully!");
    } else {
      setMockLabData(null);
    }
    
    if (reportId) {
      setSelectedReportId(reportId);
      setRefreshTrigger((prev) => prev + 1); // Trigger refresh of previous reports list
      if (!mockData) {
        toast.success("Lab report uploaded and processed successfully!");
      }
    } else {
      if (!mockData) {
        toast.success("Lab report uploaded successfully!");
      }
      setRefreshTrigger((prev) => prev + 1); // Refresh list even without report ID
    }
  }

  function handleSelectReport(reportId: string) {
    setSelectedReportId(reportId);
    
    // Check if this is an uploaded file (mock data)
    const uploadedFile = uploadedFiles.find(f => f.id === reportId);
    if (uploadedFile) {
      const mockData = getMockLabData(uploadedFile.fileName);
      if (mockData) {
        setMockLabData(mockData);
        setUploadedFileName(uploadedFile.fileName);
        return;
      }
    }
    
    // Otherwise, it's a report from the database
    setMockLabData(null);
    setUploadedFileName(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster />
      
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
                <FlaskConical className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Lab Analysis</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href={dashboardUrl}>Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left: Upload PDF */}
          <DocumentUploadSimple
            userId={userId}
            defaultDocType="lab_report"
            showDocTypeSelector={false}
            title="Upload Lab Report"
            description="Upload PDF lab reports to analyze your lab results. Files will be processed and stored for analysis."
            onUploadComplete={handleUploadSuccess}
          />

          {/* Right: View Previous Reports */}
          <PreviousReports
            userId={userId}
            onSelectReport={handleSelectReport}
            selectedReportId={selectedReportId}
            refreshTrigger={refreshTrigger}
            uploadedFiles={uploadedFiles}
          />
        </div>

        {/* Tabs - Bottom Center */}
        <Tabs defaultValue="current" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="current">Current Data</TabsTrigger>
              <TabsTrigger value="past">Past Visits</TabsTrigger>
            </TabsList>
        </div>

          <TabsContent value="current">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading report...</p>
              </div>
            ) : (
              <>
                {/* Show mock lab data if available */}
                {mockLabData && mockLabData.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">
                      Lab Parameters
                      {uploadedFileName && (
                        <span className="text-lg font-normal text-gray-600 ml-2">
                          ({uploadedFileName})
                        </span>
                      )}
                    </h2>
                    <LabCards data={mockLabData} />
                  </div>
                )}
                
                {/* Show full report view if available */}
                {selectedReport && !mockLabData && (
                  <CurrentDataCards report={selectedReport} />
                )}
                
                {/* Show message if no data */}
                {!mockLabData && !selectedReport && !loading && (
                  <CurrentDataCards report={null} />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="past">
            <PastVisitsCharts userId={userId} uploadedFiles={uploadedFiles} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
