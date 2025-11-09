"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";

interface Report {
  id: string;
  title: string;
  date: string;
  hospital: string | null;
  doctor: string | null;
}

interface UploadedFile {
  id: string;
  fileName: string;
  date: string;
  data: any; // LabRow[] | null, but we don't need the full type here
}

interface PreviousReportsProps {
  userId?: string;
  onSelectReport: (reportId: string) => void;
  selectedReportId?: string | null;
  refreshTrigger?: number; // Increment this to trigger refresh
  uploadedFiles?: UploadedFile[]; // Files uploaded in this session
}

export function PreviousReports({
  userId = "demo-user",
  onSelectReport,
  selectedReportId,
  refreshTrigger,
  uploadedFiles = [],
}: PreviousReportsProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [userId, refreshTrigger]);

  async function fetchReports() {
    try {
      setLoading(true);
      const response = await fetch(`/api/labs/list?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, reports: [...], count: number }
        if (data.success && Array.isArray(data.reports)) {
          setReports(data.reports);
        } else {
          // Fallback: if data is already an array (backward compatibility)
          setReports(Array.isArray(data) ? data : []);
        }
      } else {
        // If response is not ok, set empty array
        setReports([]);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setReports([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  }

  // Combine uploaded files and reports from API
  const allReports = [
    // Uploaded files (from this session)
    ...uploadedFiles.map(file => ({
      id: file.id,
      title: file.fileName,
      date: file.date,
      hospital: null,
      doctor: null,
      isUploaded: true, // Flag to identify uploaded files
    })),
    // Reports from database
    ...reports.map(report => ({
      ...report,
      isUploaded: false,
    })),
  ];

  const hasReports = allReports.length > 0;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">View Previous Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && reports.length === 0 && uploadedFiles.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasReports ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No previous reports yet. Upload a file to get started.
          </p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {allReports.map((report) => {
              const isSelected = selectedReportId === report.id;
              return (
                <div
                  key={report.id}
                  className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                    isSelected 
                      ? "bg-blue-50 border-blue-300 hover:bg-blue-100" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(report.date)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectReport(report.id)}
                    className={`ml-2 ${isSelected ? "text-blue-600" : ""}`}
                    title={`View ${report.title}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

