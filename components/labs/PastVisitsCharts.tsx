"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LabParameter {
  name: string;
  value: string | number;
  unit?: string | null;
  referenceRange?: string | null;
}

interface LabReport {
  id: string;
  date: string;
  parameters: Record<string, LabParameter>;
}

interface PastVisitsChartsProps {
  userId?: string;
}

interface TimeSeriesDataPoint {
  date: string;
  value: number;
  unit?: string | null;
}

export function PastVisitsCharts({ userId = "demo-user" }: PastVisitsChartsProps) {
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeriesDataPoint[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeSeries();
  }, [userId]);

  async function fetchTimeSeries() {
    try {
      setLoading(true);
      const response = await fetch(`/api/labs/list?userId=${userId}`);
      if (!response.ok) return;

      const data = await response.json();
      // API returns { success: true, reports: [...], count: number }
      const reports: LabReport[] = data.success && Array.isArray(data.reports) 
        ? data.reports 
        : Array.isArray(data) 
        ? data 
        : [];

      // Fetch full data for each report
      const fullReports = await Promise.all(
        reports.map(async (report) => {
          const detailResponse = await fetch(`/api/labs/get?id=${report.id}&userId=${userId}`);
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            // API returns { success: true, report: {...} }
            return detailData.success && detailData.report 
              ? detailData.report 
              : detailData.id 
              ? detailData 
              : null;
          }
          return null;
        })
      );

      // Build time series per parameter
      const series: Record<string, TimeSeriesDataPoint[]> = {};

      fullReports.forEach((report) => {
        if (!report || !report.parameters) return;

        // Handle different parameter formats
        let parametersToProcess: Array<[string, any]> = [];
        
        if (report.parameters.table_compact && report.parameters.table_compact.rows) {
          // Extract from table_compact format (new lab agent format)
          const rows = report.parameters.table_compact.rows;
          const columns = report.parameters.table_compact.columns || [];
          const paramIndex = columns.indexOf('Parameter') >= 0 ? columns.indexOf('Parameter') : 0;
          const valueIndex = columns.indexOf('Value') >= 0 ? columns.indexOf('Value') : 1;
          const unitIndex = columns.indexOf('Unit') >= 0 ? columns.indexOf('Unit') : -1;
          
          rows.forEach((row: any[]) => {
            if (row && row.length > paramIndex && row.length > valueIndex) {
              const paramName = String(row[paramIndex] || '');
              const paramValue = row[valueIndex] || '';
              const paramUnit = unitIndex >= 0 && row[unitIndex] ? String(row[unitIndex]) : null;
              
              if (paramName && paramValue) {
                parametersToProcess.push([paramName, { 
                  value: paramValue, 
                  unit: paramUnit 
                }]);
              }
            }
          });
        } else if (report.parameters.summary_cards && Array.isArray(report.parameters.summary_cards)) {
          // Extract from summary_cards format
          report.parameters.summary_cards.forEach((card: any) => {
            if (card.title && card.value !== undefined) {
              parametersToProcess.push([card.title, { 
                value: card.value, 
                unit: card.unit 
              }]);
            }
          });
        } else if (typeof report.parameters === 'object' && !Array.isArray(report.parameters)) {
          // Standard object format (legacy format)
          parametersToProcess = Object.entries(report.parameters);
        }

        parametersToProcess.forEach(([paramName, param]: [string, any]) => {
          // Only include numeric values
          const numValue = typeof param.value === "number" 
            ? param.value 
            : parseFloat(String(param.value || ''));
          
          if (isNaN(numValue) || !isFinite(numValue)) return;

          if (!series[paramName]) {
            series[paramName] = [];
          }

          series[paramName].push({
            date: report.date || report.createdAt || new Date().toISOString(),
            value: numValue,
            unit: param.unit || null,
          });
        });
      });

      // Sort each series by date
      Object.keys(series).forEach((paramName) => {
        series[paramName].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });

      setTimeSeries(series);
    } catch (error) {
      console.error("Failed to fetch time series:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  }

  function checkUnitsVary(series: TimeSeriesDataPoint[]): boolean {
    if (series.length === 0) return false;
    const firstUnit = series[0].unit;
    return series.some((point) => point.unit !== firstUnit);
  }

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading time series data...</p>
        </CardContent>
      </Card>
    );
  }

  const chartEntries = Object.entries(timeSeries).filter(([, data]) => data.length >= 2);

  if (chartEntries.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No past visits yet. Upload multiple lab reports to see time-series trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {chartEntries.map(([paramName, dataPoints]) => {
        const unitsVary = checkUnitsVary(dataPoints);
        const chartData = dataPoints.map((dp) => ({
          date: formatDate(dp.date),
          value: dp.value,
          unit: dp.unit || "",
        }));

        return (
          <Card key={paramName} className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{paramName}</CardTitle>
                {unitsVary && (
                  <Badge variant="outline" className="text-xs">
                    units vary
                  </Badge>
                )}
              </div>
              {dataPoints[0]?.unit && !unitsVary && (
                <CardDescription>Unit: {dataPoints[0].unit}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={paramName}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

