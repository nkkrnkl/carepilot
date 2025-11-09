"use client";

import { useMemo } from "react";

export interface LabRow {
  name: string;
  value: number;
  unit: string;
  refLow: number;
  refHigh: number;
  note?: string;
}

interface LabCardsProps {
  data: LabRow[];
}

/**
 * Compute HSL gradient color based on normalized position t in [0,1]
 * Soft, calm gradient with muted colors
 * t=0 → soft green (h=140, s=35%, l=88%)
 * t=0.5 → soft yellow (h=55, s=45%, l=88%)
 * t=1 → soft red (h=0, s=45%, l=88%)
 * Interpolate hue linearly
 */
export function hslGradient(t: number): string {
  // Clamp t to [0, 1]
  const clampedT = Math.max(0, Math.min(1, t));
  
  let h: number;
  let s: number;
  let l: number;
  
  if (clampedT <= 0.5) {
    // Green to Yellow: t from 0 to 0.5
    const localT = clampedT / 0.5; // 0 to 1
    h = 140 - (140 - 55) * localT; // 140 → 55
    s = 35 + (45 - 35) * localT;  // 35% → 45% (muted saturation)
    l = 88;                        // 88% constant (light and soft)
  } else {
    // Yellow to Red: t from 0.5 to 1
    const localT = (clampedT - 0.5) / 0.5; // 0 to 1
    h = 55 - (55 - 0) * localT;    // 55 → 0
    s = 45;                         // 45% constant (muted saturation)
    l = 88;                         // 88% constant (light and soft)
  }
  
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

/**
 * Get card background color based on value and reference range
 * Returns red if out of range, otherwise gradient color
 */
export function getCardColor(value: number, low: number, high: number): string {
  // Handle NaN or invalid values
  if (isNaN(value) || !isFinite(value)) {
    return "hsl(0 0% 85%)"; // Gray for invalid
  }
  
  // Out of range: soft red
  if (value < low || value > high) {
    return "hsl(0 50% 80%)"; // Soft, muted red
  }
  
  // In range: compute normalized position
  if (high === low) {
    // Avoid divide by zero
    return hslGradient(0.5);
  }
  
  const t = (value - low) / (high - low);
  return hslGradient(t);
}

/**
 * Get status: LOW, OK, or HIGH
 */
export function getStatus(value: number, low: number, high: number): "LOW" | "OK" | "HIGH" {
  if (isNaN(value) || !isFinite(value)) {
    return "OK"; // Default for invalid
  }
  
  if (value < low) return "LOW";
  if (value > high) return "HIGH";
  return "OK";
}

/**
 * Calculate luminance to determine if text should be dark or light
 * Returns true if background is light (use dark text)
 */
function isLightBackground(color: string): boolean {
  // For HSL colors
  if (color.startsWith("hsl")) {
    const match = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (match) {
      const lightness = parseInt(match[3]);
      return lightness > 50;
    }
  }
  
  // For hex colors (legacy support)
  if (color.startsWith("#")) {
    // Hex colors - assume light if it's a light color
    return true;
  }
  
  return true;
}

function LabCard({ row }: { row: LabRow }) {
  const status = getStatus(row.value, row.refLow, row.refHigh);
  const bgColor = getCardColor(row.value, row.refLow, row.refHigh);
  const isLight = isLightBackground(bgColor);
  
  // Compute normalized position for marker
  let markerPosition = 0.5;
  if (isNaN(row.value) || !isFinite(row.value)) {
    markerPosition = 0.5;
  } else if (row.value < row.refLow) {
    markerPosition = 0;
  } else if (row.value > row.refHigh) {
    markerPosition = 1;
  } else if (row.refHigh !== row.refLow) {
    markerPosition = (row.value - row.refLow) / (row.refHigh - row.refLow);
  }
  
  const textColor = isLight ? "text-gray-800" : "text-gray-900";
  const statusChipColor = status === "OK" 
    ? "bg-slate-50 text-slate-600 border-slate-200" 
    : "bg-red-50 text-red-600 border-red-200";
  
  const ariaLabel = isNaN(row.value) || !isFinite(row.value)
    ? `${row.name}: N/A. Reference ${row.refLow} to ${row.refHigh} ${row.unit}.`
    : `${row.name}: ${row.value} ${row.unit}. Reference ${row.refLow} to ${row.refHigh} ${row.unit}. Status ${status}.`;
  
  return (
    <div
      className="rounded-2xl shadow-sm border p-4 transition-colors"
      style={{ backgroundColor: bgColor }}
      aria-label={ariaLabel}
    >
      {/* Header: Name and Status */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-base font-semibold ${textColor}`}>
          {row.name}
        </h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full border ${statusChipColor}`}
        >
          {status}
        </span>
      </div>
      
      {/* Value */}
      {isNaN(row.value) || !isFinite(row.value) ? (
        <div className={`text-2xl font-bold ${textColor} mb-2`}>
          N/A
        </div>
      ) : (
        <div className={`text-3xl font-bold tracking-tight ${textColor} mb-2`}>
          {row.value} <span className="text-lg">{row.unit}</span>
        </div>
      )}
      
      {/* Reference Range */}
      <div className={`text-sm ${isLight ? "text-slate-700/80" : "text-white/90"} mb-3`}>
        Ref: {row.refLow}–{row.refHigh} {row.unit}
        {row.note && <span className="ml-1">({row.note})</span>}
      </div>
      
      {/* Range Bar */}
      <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 relative overflow-hidden">
        {/* Gradient fill for in-range values */}
        {status === "OK" && row.refHigh !== row.refLow && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(to right, ${hslGradient(0)}, ${hslGradient(1)})`,
              opacity: 0.2
            }}
          />
        )}
        
        {/* Out-of-range red bar */}
        {status !== "OK" && (
          <div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: "hsl(0 50% 80% / 0.3)" }}
          />
        )}
        
        {/* Marker dot */}
        <div
          className="absolute top-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-800 shadow-sm z-10"
          style={{
            left: `${markerPosition * 100}%`,
            transform: "translate(-50%, -50%)"
          }}
          title={`Percentile: ${Math.round(markerPosition * 100)}% within range`}
        />
      </div>
    </div>
  );
}

export function LabCards({ data }: LabCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {data.map((row, index) => (
        <LabCard key={`${row.name}-${index}`} row={row} />
      ))}
    </div>
  );
}

