"use client";

import { useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
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

interface UploadedFile {
  id: string;
  fileName: string;
  date: string;
  data: Array<{
    name: string;
    value: number;
    unit: string;
    refLow: number;
    refHigh: number;
    note?: string;
  }> | null;
}

interface PastVisitsChartsProps {
  userId?: string;
  uploadedFiles?: UploadedFile[];
}

interface TimeSeriesDataPoint {
  date: string;
  value: number;
  unit?: string | null;
}

// Memoized chart component to prevent re-renders
const ChartCard = memo(({ 
  paramName, 
  dataPoints, 
  chartData 
}: { 
  paramName: string; 
  dataPoints: TimeSeriesDataPoint[]; 
  chartData: Array<{ date: string; value: number; unit: string }> 
}) => {
  const unitsVary = useMemo(() => {
    if (dataPoints.length === 0) return false;
    const firstUnit = dataPoints[0].unit;
    return dataPoints.some((point) => point.unit !== firstUnit);
  }, [dataPoints]);

  return (
    <Card className="border-2">
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
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if paramName, dataPoints, or chartData actually changed
  if (prevProps.paramName !== nextProps.paramName) return false;
  if (prevProps.dataPoints.length !== nextProps.dataPoints.length) return false;
  if (prevProps.chartData.length !== nextProps.chartData.length) return false;
  
  // Deep compare dataPoints
  for (let i = 0; i < prevProps.dataPoints.length; i++) {
    if (prevProps.dataPoints[i].date !== nextProps.dataPoints[i].date ||
        prevProps.dataPoints[i].value !== nextProps.dataPoints[i].value) {
      return false;
    }
  }
  
  // Deep compare chartData
  for (let i = 0; i < prevProps.chartData.length; i++) {
    if (prevProps.chartData[i].date !== nextProps.chartData[i].date ||
        prevProps.chartData[i].value !== nextProps.chartData[i].value) {
      return false;
    }
  }
  
  return true; // Props are equal, skip re-render
});

ChartCard.displayName = "ChartCard";

export function PastVisitsCharts({ userId = "demo-user", uploadedFiles = [] }: PastVisitsChartsProps) {
  // Memoize the time series calculation to prevent unnecessary recalculations
  // Use JSON.stringify for deep comparison to prevent re-renders when array reference changes but content is same
  const uploadedFilesSerialized = useMemo(() => {
    return JSON.stringify(uploadedFiles.map(f => ({
      id: f.id,
      fileName: f.fileName,
      date: f.date,
      dataLength: f.data?.length || 0
    })));
  }, [uploadedFiles]);

  const timeSeries = useMemo(() => {
    // Build time series per parameter from uploaded files
    const series: Record<string, TimeSeriesDataPoint[]> = {};

    // Process uploaded files (mock data)
    uploadedFiles.forEach((uploadedFile) => {
      if (!uploadedFile.data || uploadedFile.data.length === 0) {
        return;
      }

      uploadedFile.data.forEach((param) => {
        if (!param.name || param.value === undefined || param.value === null) {
          return;
        }

        // Ensure value is a number
        const numValue = typeof param.value === "number" ? param.value : parseFloat(String(param.value));
        if (isNaN(numValue) || !isFinite(numValue)) {
          return;
        }

        if (!series[param.name]) {
          series[param.name] = [];
        }

        series[param.name].push({
          date: uploadedFile.date,
          value: numValue,
          unit: param.unit || null,
        });
      });
    });

    // Sort each series by date
    Object.keys(series).forEach((paramName) => {
      series[paramName].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    // Filter to only show parameters that appear in 2+ visits (common parameters)
    const filteredSeries: Record<string, TimeSeriesDataPoint[]> = {};
    Object.keys(series).forEach((paramName) => {
      if (series[paramName].length >= 2) {
        filteredSeries[paramName] = series[paramName];
      }
    });

    return filteredSeries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFilesSerialized]);

  const formatDate = useMemo(() => {
    return (dateStr: string): string => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } catch {
        return dateStr;
      }
    };
  }, []);

  const chartEntries = useMemo(() => {
    return Object.entries(timeSeries).filter(([, data]) => data.length >= 2);
  }, [timeSeries]);

  // Memoize chart data for each parameter to prevent unnecessary re-renders
  const chartDataMap = useMemo(() => {
    const map: Record<string, Array<{ date: string; value: number; unit: string }>> = {};
    chartEntries.forEach(([paramName, dataPoints]) => {
      map[paramName] = dataPoints.map((dp) => {
        try {
          const date = new Date(dp.date);
          return {
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: dp.value,
            unit: dp.unit || "",
          };
        } catch {
          return {
            date: dp.date,
            value: dp.value,
            unit: dp.unit || "",
          };
        }
      });
    });
    return map;
  }, [chartEntries]);

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
        const chartData = chartDataMap[paramName] || [];
        return (
          <ChartCard
            key={paramName}
            paramName={paramName}
            dataPoints={dataPoints}
            chartData={chartData}
          />
        );
      })}
    </div>
  );
}

