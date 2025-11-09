"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, CircleDollarSign, ExternalLink, FolderOpen, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AppointmentSummary = {
  id: string;
  date: string;
  displayDate: string;
  displayTime?: string | null;
  type: "in-person" | "telehealth";
  doctorName?: string | null;
  location?: string | null;
  status?: string | null;
  href: string;
  preparation?: string | null;
};

export type ActiveCasesSummary = {
  total: number;
  needsReview: number;
  estimatedSavings?: number;
  highlight?: {
    title: string;
    amount: number;
    status: string;
    href: string;
  } | null;
};

export type ActivityItem = {
  id: string;
  label: string;
  timestamp: string;
  icon?: ReactNode;
  accent?: "labs" | "appointments" | "cases" | "general";
};

type QuickAccessModulesProps = {
  appointments: AppointmentSummary[];
  activeCases: ActiveCasesSummary;
  recentActivity: ActivityItem[];
};

const accentStyles: Record<NonNullable<ActivityItem["accent"]>, string> = {
  labs: "bg-blue-100 text-blue-700",
  appointments: "bg-emerald-100 text-emerald-700",
  cases: "bg-purple-100 text-purple-700",
  general: "bg-slate-100 text-slate-700",
};

export function QuickAccessModules({
  appointments,
  activeCases,
  recentActivity,
}: QuickAccessModulesProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="border border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Upcoming Appointments</CardTitle>
            <Badge variant="outline" className="text-xs">
              {appointments.length} scheduled
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-4 text-sm text-muted-foreground">
              No appointments scheduled. Need to book one? Try{" "}
              <Link href="/features/scheduling" className="text-foreground underline underline-offset-2">
                Appointment Scheduling
              </Link>
              .
            </div>
          ) : (
            appointments.slice(0, 2).map((apt) => (
              <div
                key={apt.id}
                className={cn(
                  "rounded-xl border border-transparent bg-muted/40 p-4 transition-colors hover:border-primary/20 hover:bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      <span>{apt.displayDate}</span>
                      {apt.displayTime && <span>• {apt.displayTime}</span>}
                    </div>
                    <p className="mt-1 text-base font-semibold">
                      {apt.doctorName || "Appointment"}
                    </p>
                    {apt.location && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {apt.location}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {apt.type === "telehealth" ? "Virtual" : "In-person"}
                  </Badge>
                </div>
                {apt.preparation && (
                  <p className="mt-3 rounded-lg border border-dashed border-muted-foreground/40 bg-background px-3 py-2 text-xs text-muted-foreground">
                    {apt.preparation}
                  </p>
                )}
                <Button asChild variant="link" className="mt-2 h-auto px-0 text-sm">
                  <Link href={apt.href}>
                    View details
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Active Cases</CardTitle>
            <Badge variant="outline" className="text-xs">
              {activeCases.total} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-dashed border-purple-200 bg-purple-50/70 px-4 py-3">
            <div>
              <p className="text-sm text-purple-700">Cases needing review</p>
              <p className="text-2xl font-semibold text-purple-900">{activeCases.needsReview}</p>
            </div>
            <CircleDollarSign className="h-8 w-8 text-purple-500" />
          </div>
          {activeCases.estimatedSavings !== undefined && (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-emerald-700">Estimated Savings</p>
              <p className="text-xl font-semibold text-emerald-900">
                ${activeCases.estimatedSavings.toFixed(0)}
              </p>
              <p className="text-xs text-emerald-700/80">
                Based on AI-negotiated case outcomes
              </p>
            </div>
          )}
          {activeCases.highlight ? (
            <div className="space-y-2 rounded-xl border border-muted-foreground/20 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  {activeCases.highlight.title}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                ${activeCases.highlight.amount.toFixed(2)} • {activeCases.highlight.status}
              </p>
              <Button asChild variant="link" className="h-auto px-0 text-sm">
                <Link href={activeCases.highlight.href}>
                  Manage case
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload an EOB or bill to kick off a new negotiation or appeal.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-4 text-sm text-muted-foreground">
              Nothing new yet. Upload documents or connect your providers to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-transparent bg-muted/40 p-3"
                >
                  {item.icon && (
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold uppercase",
                        accentStyles[item.accent || "general"]
                      )}
                    >
                      {item.icon}
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button asChild variant="link" className="h-auto px-0 text-sm">
            <Link href="/features/cases">View full activity log</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
