"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, User } from "lucide-react";

interface LabParameter {
  value: string | number;
  unit?: string | null;
  referenceRange?: string | null;
}

interface LabReport {
  id: string;
  title: string;
  date: string;
  hospital: string | null;
  doctor: string | null;
  parameters: Record<string, LabParameter>; // Key is the parameter name
}

interface CurrentDataCardsProps {
  report: LabReport | null;
}

export function CurrentDataCards({ report }: CurrentDataCardsProps) {
  if (!report) {
    return (
      <Card className="border-2">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No report selected. Upload a lab test or select a previous report.</p>
        </CardContent>
      </Card>
    );
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  const parameters = Object.entries(report.parameters);

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {report.hospital && (
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Hospital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{report.hospital}</p>
            </CardContent>
          </Card>
        )}

        {report.doctor && (
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{report.doctor}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDate(report.date)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Parameter Cards */}
      {parameters.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parameters.map(([name, param]) => (
              <Card key={name} className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{param.value}</span>
                    {param.unit && <span className="text-sm text-muted-foreground">{param.unit}</span>}
                  </div>
                  {param.referenceRange && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Range: {param.referenceRange}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

