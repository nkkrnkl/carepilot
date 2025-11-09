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
  date?: string | null;
  createdAt?: string | null;
  hospital?: string | null;
  doctor?: string | null;
  parameters: Record<string, LabParameter> | any; // Key is the parameter name, or lab agent format
}

interface CurrentDataCardsProps {
  report: LabReport | null;
}

type ParameterStatus = "normal" | "low" | "high" | "unknown";

/**
 * Parse reference range string and determine parameter status
 * Handles formats like: "0.6-1.2", "70-100", "< 5.0", "> 10.0", etc.
 */
function parseReferenceRange(rangeStr: string): { min: number | null; max: number | null } | null {
  if (!rangeStr) return null;
  
  // Remove common prefixes and clean the string
  let cleaned = rangeStr.trim().replace(/^(range|ref|reference):?\s*/i, "");
  
  // Handle "< value" format (upper limit only)
  const lessThanMatch = cleaned.match(/^<\s*([\d.]+)/i);
  if (lessThanMatch) {
    return { min: null, max: parseFloat(lessThanMatch[1]) };
  }
  
  // Handle "> value" format (lower limit only)
  const greaterThanMatch = cleaned.match(/^>\s*([\d.]+)/i);
  if (greaterThanMatch) {
    return { min: parseFloat(greaterThanMatch[1]), max: null };
  }
  
  // Handle "value1 - value2" or "value1-value2" format
  const rangeMatch = cleaned.match(/([\d.]+)\s*[-–—]\s*([\d.]+)/);
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2])
    };
  }
  
  // Try to extract numbers if format is unclear
  const numbers = cleaned.match(/[\d.]+/g);
  if (numbers && numbers.length >= 2) {
    const nums = numbers.map(n => parseFloat(n)).sort((a, b) => a - b);
    return { min: nums[0], max: nums[nums.length - 1] };
  }
  
  return null;
}

/**
 * Determine if a parameter value is within, above, or below the reference range
 */
function getParameterStatus(
  value: string | number,
  referenceRange: string | null | undefined
): ParameterStatus {
  if (!referenceRange) return "unknown";
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "unknown";
  
  const range = parseReferenceRange(referenceRange);
  if (!range) return "unknown";
  
  if (range.min !== null && range.max !== null) {
    // Full range: check if within bounds
    if (numValue >= range.min && numValue <= range.max) {
      return "normal";
    } else if (numValue < range.min) {
      return "low";
    } else {
      return "high";
    }
  } else if (range.min !== null) {
    // Only lower limit: check if above
    return numValue >= range.min ? "normal" : "low";
  } else if (range.max !== null) {
    // Only upper limit: check if below
    return numValue <= range.max ? "normal" : "high";
  }
  
  return "unknown";
}

/**
 * Get gradient classes based on parameter status
 */
function getGradientClasses(status: ParameterStatus): string {
  switch (status) {
    case "normal":
      return "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800";
    case "low":
      return "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-950/20 dark:to-cyan-950/20 dark:border-blue-800";
    case "high":
      return "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800";
    case "unknown":
    default:
      return "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 dark:from-gray-950/20 dark:to-slate-950/20 dark:border-gray-800";
  }
}

/**
 * Get status badge variant and text
 */
function getStatusBadge(status: ParameterStatus): { variant: "default" | "secondary" | "destructive" | "outline"; text: string; className: string } {
  switch (status) {
    case "normal":
      return {
        variant: "default",
        text: "Normal",
        className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
      };
    case "low":
      return {
        variant: "secondary",
        text: "Low",
        className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
      };
    case "high":
      return {
        variant: "destructive",
        text: "High",
        className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
      };
    case "unknown":
    default:
      return {
        variant: "outline",
        text: "No Range",
        className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300"
      };
  }
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

  // Transform parameters from lab agent format to expected format
  function transformParameters(params: any): Record<string, LabParameter> {
    if (!params) return {};
    
    // If already in the expected format (Record<string, LabParameter>)
    if (typeof params === 'object' && !Array.isArray(params) && !params.table_compact && !params.summary_cards) {
      return params;
    }
    
    const transformed: Record<string, LabParameter> = {};
    
    // Handle table_compact format (new lab agent format)
    if (params.table_compact && params.table_compact.rows) {
      const rows = params.table_compact.rows;
      const columns = params.table_compact.columns || [];
      const paramIndex = columns.indexOf('Parameter') >= 0 ? columns.indexOf('Parameter') : 0;
      const valueIndex = columns.findIndex((col: string) => 
        col.toLowerCase().includes('value') || col.toLowerCase().includes('result')
      );
      const unitIndex = columns.findIndex((col: string) => 
        col.toLowerCase().includes('unit')
      );
      const rangeIndex = columns.findIndex((col: string) => 
        col.toLowerCase().includes('range') || col.toLowerCase().includes('reference')
      );
      
      rows.forEach((row: any[]) => {
        if (row && row.length > paramIndex && row.length > valueIndex) {
          const paramName = String(row[paramIndex] || '').trim();
          if (!paramName) return;
          
          const paramValue = row[valueIndex] || '';
          const paramUnit = unitIndex >= 0 && row[unitIndex] ? String(row[unitIndex]) : null;
          const paramRange = rangeIndex >= 0 && row[rangeIndex] ? String(row[rangeIndex]) : null;
          
          transformed[paramName] = {
            value: paramValue,
            unit: paramUnit || undefined,
            referenceRange: paramRange || undefined,
          };
        }
      });
    }
    
    // Also handle summary_cards format
    if (params.summary_cards && Array.isArray(params.summary_cards)) {
      params.summary_cards.forEach((card: any) => {
        if (card.title) {
          transformed[card.title] = {
            value: card.value || '',
            unit: card.unit || undefined,
            referenceRange: card.detail || undefined,
          };
        }
      });
    }
    
    return transformed;
  }

  const parameters = Object.entries(transformParameters(report.parameters));

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
            <p className="text-lg font-semibold">
              {report.date ? formatDate(report.date) : report.createdAt ? formatDate(report.createdAt) : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Parameter Cards */}
      {parameters.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parameters.map(([name, param]) => {
              const status = getParameterStatus(param.value, param.referenceRange);
              const gradientClasses = getGradientClasses(status);
              const statusBadge = getStatusBadge(status);
              
              return (
                <Card 
                  key={name} 
                  className={`border-2 transition-all duration-200 hover:shadow-md ${gradientClasses}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold">{param.value}</span>
                      {param.unit && <span className="text-sm text-muted-foreground">{param.unit}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      {param.referenceRange && (
                        <Badge variant="outline" className="text-xs w-fit">
                          Range: {param.referenceRange}
                        </Badge>
                      )}
                      <Badge 
                        variant={statusBadge.variant} 
                        className={`text-xs w-fit ${statusBadge.className}`}
                      >
                        {statusBadge.text}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

