"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDropzone } from "@/components/labs/UploadDropzone";
import { PreviousReports } from "@/components/labs/PreviousReports";
import { CurrentDataCards } from "@/components/labs/CurrentDataCards";
import { PastVisitsCharts } from "@/components/labs/PastVisitsCharts";
import { Toaster, toast } from "sonner";

interface LabReport {
  id: string;
  title: string;
  date: string;
  hospital: string | null;
  doctor: string | null;
  parameters: Record<string, { value: string | number; unit?: string | null; referenceRange?: string | null }>;
}

export default function LabsPage() {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userId] = useState("demo-user"); // In production, get from auth

  // Load report when selectedReportId changes
  useEffect(() => {
    if (selectedReportId) {
      loadReport(selectedReportId);
    } else {
      setSelectedReport(null);
    }
  }, [selectedReportId]);

  async function loadReport(reportId: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/labs/get?id=${reportId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data);
      } else {
        toast.error("Failed to load report");
      }
    } catch (error) {
      console.error("Failed to load report:", error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  function handleUploadSuccess(reportId: string) {
    setSelectedReportId(reportId);
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh of previous reports list
    toast.success("Lab report uploaded and processed successfully!");
  }

  function handleSelectReport(reportId: string) {
    setSelectedReportId(reportId);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster />
      
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Lab Report Ingest + Timeline</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left: Upload PDF */}
          <UploadDropzone onUploadSuccess={handleUploadSuccess} userId={userId} />

          {/* Right: View Previous Reports */}
          <PreviousReports
            userId={userId}
            onSelectReport={handleSelectReport}
            selectedReportId={selectedReportId}
            refreshTrigger={refreshTrigger}
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
              <CurrentDataCards report={selectedReport} />
            )}
          </TabsContent>

          <TabsContent value="past">
            <PastVisitsCharts userId={userId} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
