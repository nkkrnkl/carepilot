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

interface PreviousReportsProps {
  userId?: string;
  onSelectReport: (reportId: string) => void;
  selectedReportId?: string | null;
  refreshTrigger?: number; // Increment this to trigger refresh
}

export function PreviousReports({
  userId = "demo-user",
  onSelectReport,
  selectedReportId,
  refreshTrigger,
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
        setReports(data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
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

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">View Previous Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No previous reports yet. Upload a file to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{report.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(report.date)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectReport(report.id)}
                  className="ml-2"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

