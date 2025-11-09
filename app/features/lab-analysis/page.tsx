"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploadSimple } from "@/components/documents/document-upload-simple";
import { PreviousReports } from "@/components/labs/PreviousReports";
import { CurrentDataCards } from "@/components/labs/CurrentDataCards";
import { PastVisitsCharts } from "@/components/labs/PastVisitsCharts";
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
  const userId = user?.email || "demo-user"; // Use authenticated user email, fallback to demo

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

  function handleUploadSuccess(file: any) {
    // Extract report ID from uploaded file
    const reportId = file.id || file.docId;
    if (reportId) {
      setSelectedReportId(reportId);
      setRefreshTrigger((prev) => prev + 1); // Trigger refresh of previous reports list
      toast.success("Lab report uploaded and processed successfully!");
    } else {
      toast.success("Lab report uploaded successfully!");
      setRefreshTrigger((prev) => prev + 1); // Refresh list even without report ID
    }
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
