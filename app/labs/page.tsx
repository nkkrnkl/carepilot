"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadPanel } from "@/components/labs/UploadPanel";
import { PreviousReports } from "@/components/labs/PreviousReports";
import { CurrentDataCards } from "@/components/labs/CurrentDataCards";
import { PastVisitsCharts } from "@/components/labs/PastVisitsCharts";
import { LabReport } from "@/lib/labs/types";
import { ArrowLeft, FlaskConical } from "lucide-react";

export default function LabsPage() {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [view, setView] = useState<"current" | "past">("current");
  const [loading, setLoading] = useState(true);

  // Fetch reports on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/labs/list");
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data: LabReport[] = await res.json();
        setReports(data);
        // Preselect the first (most recent) report if available
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleUploaded = (report: LabReport) => {
    // Prepend new report to the list
    setReports((prev) => [report, ...prev]);
    // Select the newly uploaded report
    setSelectedId(report.id);
    // Switch to current view
    setView("current");
  };

  const selectedReport = reports.find((r) => r.id === selectedId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Lab Reports</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Section: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Upload */}
          <UploadPanel onUploaded={handleUploaded} />

          {/* Right: Previous Reports */}
          <PreviousReports
            reports={reports}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Centered Toggle Buttons */}
        <div className="flex justify-center gap-3 my-6">
          <Button
            variant={view === "current" ? "default" : "outline"}
            onClick={() => setView("current")}
            size="lg"
          >
            Current Data
          </Button>
          <Button
            variant={view === "past" ? "default" : "outline"}
            onClick={() => setView("past")}
            size="lg"
          >
            Past Visits
          </Button>
        </div>

        {/* Content Area */}
        <div>
          {view === "current" ? (
            <CurrentDataCards report={selectedReport} />
          ) : (
            <PastVisitsCharts reports={reports} />
          )}
        </div>
      </div>
    </div>
  );
}

