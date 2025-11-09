"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { AlertTriangle, CalendarDays, FlaskConical, Loader2 } from "lucide-react";
import { PatientNavbar } from "@/components/layout/patient-navbar";
import {
  NeedsAttention,
  type AttentionItem,
} from "@/components/dashboard/needs-attention";
import { CommandBar } from "@/components/dashboard/command-bar";
import {
  QuickAccessModules,
  type ActiveCasesSummary,
  type ActivityItem,
  type AppointmentSummary,
} from "@/components/dashboard/quick-access-modules";
import { CoreShortcuts } from "@/components/dashboard/core-shortcuts";
import {
  SAMPLE_APPOINTMENTS,
  SAMPLE_CASES,
  SAMPLE_LAB_REPORTS,
  type SampleAppointment,
  type SampleLabParameter,
  type SampleLabReport,
} from "@/lib/sample-data";
import { CaseData } from "@/lib/types/cases";
import { getCases } from "@/lib/services/cases-service";

type ParameterStatus = "normal" | "low" | "high" | "unknown";

function parseReferenceRange(
  range?: string | null
): { min: number | null; max: number | null } | null {
  if (!range) return null;
  const cleaned = range.trim().replace(/^(range|ref|reference):?\s*/i, "");
  const lessThanMatch = cleaned.match(/^<\s*([\d.]+)/i);
  if (lessThanMatch) return { min: null, max: parseFloat(lessThanMatch[1]) };
  const greaterThanMatch = cleaned.match(/^>\s*([\d.]+)/i);
  if (greaterThanMatch) return { min: parseFloat(greaterThanMatch[1]), max: null };
  const rangeMatch = cleaned.match(/([\d.]+)\s*[-–—]\s*([\d.]+)/);
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2]),
    };
  }
  const numbers = cleaned.match(/[\d.]+/g);
  if (numbers && numbers.length >= 2) {
    const values = numbers.map(Number).sort((a, b) => a - b);
    return { min: values[0], max: values[values.length - 1] };
  }
  return null;
}

function getParameterStatus(
  value: string | number,
  referenceRange?: string | null
): ParameterStatus {
  if (!referenceRange) return "unknown";
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(numericValue)) return "unknown";
  const range = parseReferenceRange(referenceRange);
  if (!range) return "unknown";
  if (range.min !== null && range.max !== null) {
    if (numericValue < range.min) return "low";
    if (numericValue > range.max) return "high";
    return "normal";
  }
  if (range.min !== null) {
    return numericValue < range.min ? "low" : "normal";
  }
  if (range.max !== null) {
    return numericValue > range.max ? "high" : "normal";
  }
  return "unknown";
}

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateDisplay(value: string | Date | null): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeDisplay(dateIso: string, time?: string | null): string | null {
  if (time) return time;
  const date = toDate(dateIso);
  if (!date) return null;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatRelativeTime(targetDate: Date): string {
  const now = Date.now();
  const diffMs = targetDate.getTime() - now;
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffMinutes) < 60) {
    if (diffMinutes === 0) return "just now";
    return diffMinutes > 0
      ? `in ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"}`
      : `${Math.abs(diffMinutes)} minute${diffMinutes === -1 ? "" : "s"} ago`;
  }

  if (Math.abs(diffHours) < 24) {
    return diffHours > 0
      ? `in ${diffHours} hour${diffHours === 1 ? "" : "s"}`
      : `${Math.abs(diffHours)} hour${diffHours === -1 ? "" : "s"} ago`;
  }

  if (Math.abs(diffDays) < 7) {
    return diffDays > 0
      ? `in ${diffDays} day${diffDays === 1 ? "" : "s"}`
      : `${Math.abs(diffDays)} day${diffDays === -1 ? "" : "s"} ago`;
  }

  return targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getFirstNameFromUser(user: ReturnType<typeof useUser>["user"]): string {
  if (!user) return "there";
  const candidates = [user.given_name, user.nickname, user.name?.split(" ").at(0)].filter(
    Boolean
  );
  return (candidates[0] as string) || "there";
}

async function fetchAppointments(userEmail: string): Promise<SampleAppointment[]> {
  try {
    const response = await fetch(
      `/api/appointments?userEmailAddress=${encodeURIComponent(userEmail)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    const appointments = Array.isArray(data?.appointments) ? data.appointments : [];
    return appointments.map((apt: any) => {
      const appointmentDate =
        typeof apt.appointmentDate === "string"
          ? apt.appointmentDate
          : apt.appointmentDate
          ? new Date(apt.appointmentDate).toISOString()
          : new Date().toISOString();

      return {
        id: apt.appointment_id || apt.id || `${apt.doctorId ?? "apt"}-${appointmentDate}`,
        appointmentDate,
        appointmentTime: apt.appointmentTime ?? null,
        appointmentType: (apt.appointmentType as SampleAppointment["appointmentType"]) || "in-person",
        status: (apt.status as SampleAppointment["status"]) || "scheduled",
        doctorName: apt.doctorName || apt.doctorId || null,
        location: apt.location || apt.address || null,
        notes: apt.notes || null,
        preparation: apt.preparation || null,
      };
    });
  } catch (error) {
    console.warn("Unable to fetch appointments:", error);
    return [];
  }
}

type FlaggedParameter = SampleLabParameter & { status: "low" | "high" };

function extractFlaggedParameters(report: SampleLabReport): FlaggedParameter[] {
  return report.parameters
    .map((parameter) => {
      const status = getParameterStatus(parameter.value, parameter.referenceRange);
      if (status === "high" || status === "low") {
        return { ...parameter, status };
      }
      return null;
    })
    .filter((item): item is FlaggedParameter => Boolean(item));
}

export default function PatientDashboard() {
  const { user, isLoading: authLoading } = useUser();
  const [labReports, setLabReports] = useState<SampleLabReport[]>(SAMPLE_LAB_REPORTS);
  const [appointments, setAppointments] = useState<SampleAppointment[]>(SAMPLE_APPOINTMENTS);
  const [cases, setCases] = useState<CaseData[]>(SAMPLE_CASES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const userId = user?.email ?? "user-123";
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [caseResults, appointmentResults] = await Promise.all([
          getCases(userId),
          fetchAppointments(userId),
        ]);

        if (cancelled) return;

        if (caseResults.length) {
          setCases(caseResults);
        } else {
          setCases(SAMPLE_CASES);
        }

        if (appointmentResults.length) {
          setAppointments(appointmentResults);
        } else {
          setAppointments(SAMPLE_APPOINTMENTS);
        }

        // TODO: integrate live lab summaries when available
        setLabReports(SAMPLE_LAB_REPORTS);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (!cancelled) {
          setError("We couldn’t refresh all data. Showing the latest available information.");
          setCases(SAMPLE_CASES);
          setAppointments(SAMPLE_APPOINTMENTS);
          setLabReports(SAMPLE_LAB_REPORTS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.email]);

  const sortedLabReports = useMemo(() => {
    return [...labReports].sort((a, b) => {
      const dateA = toDate(a.date)?.getTime() ?? 0;
      const dateB = toDate(b.date)?.getTime() ?? 0;
      return dateB - dateA;
    });
  }, [labReports]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = toDate(a.appointmentDate)?.getTime() ?? 0;
      const dateB = toDate(b.appointmentDate)?.getTime() ?? 0;
      return dateA - dateB;
    });
  }, [appointments]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    const latestLab = sortedLabReports[0];
    if (latestLab) {
      const flagged = extractFlaggedParameters(latestLab);
      if (flagged.length > 0) {
        const primary = flagged[0];
        const statusLabel = primary.status === "high" ? "above" : "below";
        const rangeText = primary.referenceRange ? `(${primary.referenceRange})` : "";
        items.push({
          id: `lab-${latestLab.id}`,
          title: "New lab insights ready",
          description: `${primary.name} is ${statusLabel} your goal at ${primary.value}${
            primary.unit ? ` ${primary.unit}` : ""
          } ${rangeText}.`,
          summary:
            latestLab.summary ||
            `We found ${flagged.length} lab value${flagged.length === 1 ? "" : "s"} that could use a closer look.`,
          icon: <FlaskConical className="h-5 w-5" />,
          severity: "warning",
          timestamp: formatDateDisplay(latestLab.date),
          action: {
            label: "View plain-English analysis",
            href: "/features/lab-analysis",
          },
        });
      }
    }

    const casesNeedingReview = cases.filter((item) => item.status === "Needs Review");
    if (casesNeedingReview.length > 0) {
      const topCase = casesNeedingReview[0];
      const owed = typeof topCase.amount === "number" ? topCase.amount : null;
      items.push({
        id: `case-${topCase.id}`,
        title: topCase.title || "Billing discrepancy detected",
        description:
          topCase.description ||
          "We spotted a mismatch between the provider bill and your Explanation of Benefits.",
        summary:
          owed !== null
            ? `Current balance flagged: $${owed.toFixed(2)}`
            : "We'll walk you through the next best step.",
        icon: <AlertTriangle className="h-5 w-5" />,
        severity: "critical",
        timestamp: formatDateDisplay(topCase.date),
        action: {
          label: "Start dispute",
          href: `/features/cases?caseId=${encodeURIComponent(topCase.id)}`,
        },
      });
    }

    const upcomingSoon = sortedAppointments.find((apt) => {
      const date = toDate(apt.appointmentDate);
      if (!date) return false;
      const diffDays = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 2;
    });

    if (upcomingSoon) {
      const date = toDate(upcomingSoon.appointmentDate);
      items.push({
        id: `apt-${upcomingSoon.id}`,
        title: "Appointment reminder",
        description: `You have ${
          upcomingSoon.appointmentType === "telehealth" ? "a virtual visit" : "an appointment"
        } ${date ? formatRelativeTime(date) : "soon"}.`,
        summary: upcomingSoon.preparation || upcomingSoon.notes || undefined,
        icon: <CalendarDays className="h-5 w-5" />,
        severity: "info",
        timestamp: formatDateDisplay(upcomingSoon.appointmentDate),
        action: {
          label: "View details",
          href: `/features/scheduling?appointmentId=${encodeURIComponent(upcomingSoon.id)}`,
        },
      });
    }

    return items;
  }, [cases, sortedAppointments, sortedLabReports]);

  const appointmentSummaries = useMemo<AppointmentSummary[]>(() => {
    return sortedAppointments.map((apt) => {
      const appointmentDate = toDate(apt.appointmentDate);
      return {
        id: apt.id,
        date: apt.appointmentDate,
        displayDate: appointmentDate
          ? appointmentDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : formatDateDisplay(apt.appointmentDate),
        displayTime: formatTimeDisplay(apt.appointmentDate, apt.appointmentTime),
        type: apt.appointmentType,
        doctorName: apt.doctorName,
        location: apt.location,
        status: apt.status,
        preparation: apt.preparation || apt.notes,
        href: `/features/scheduling?appointmentId=${encodeURIComponent(apt.id)}`,
      };
    });
  }, [sortedAppointments]);

  const activeCasesSummary = useMemo<ActiveCasesSummary>(() => {
    const total = cases.length;
    const needsReview = cases.filter((item) => item.status === "Needs Review").length;
    const estimatedSavings = cases.reduce((sum, current) => {
      if (typeof current.total_billed === "number" && typeof current.amount === "number") {
        const difference = current.total_billed - current.amount;
        if (difference > 0) {
          return sum + difference;
        }
      }
      if (typeof current.total_benefits_approved === "number" && typeof current.amount === "number") {
        const difference = current.total_benefits_approved - current.amount;
        if (difference > 0) {
          return sum + difference;
        }
      }
      return sum;
    }, 0);
    const highlightCandidate = cases.find(
      (item) => item.status === "Needs Review" || item.status === "In Progress"
    );
    return {
      total,
      needsReview,
      estimatedSavings: estimatedSavings || undefined,
      highlight: highlightCandidate
        ? {
            title: highlightCandidate.title,
            amount: highlightCandidate.amount,
            status: highlightCandidate.status,
            href: `/features/cases?caseId=${encodeURIComponent(highlightCandidate.id)}`,
          }
        : null,
    };
  }, [cases]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    type DatedItem = ActivityItem & { dateValue: Date };
    const items: DatedItem[] = [];

    sortedLabReports.forEach((report) => {
      const date = toDate(report.date);
      if (!date) return;
      items.push({
        id: `activity-lab-${report.id}`,
        label: `Uploaded lab report: ${report.title}`,
        timestamp: formatRelativeTime(date),
        icon: "LAB",
        accent: "labs",
        dateValue: date,
      });
    });

    cases.forEach((caseItem) => {
      const date = toDate(caseItem.date) ?? new Date();
      items.push({
        id: `activity-case-${caseItem.id}`,
        label: `Case ${caseItem.status.toLowerCase()}: ${caseItem.title}`,
        timestamp: formatRelativeTime(date),
        icon: "CASE",
        accent: "cases",
        dateValue: date,
      });
    });

    appointments.forEach((apt) => {
      const date = toDate(apt.appointmentDate);
      if (!date) return;
      items.push({
        id: `activity-apt-${apt.id}`,
        label: `Appointment ${apt.status.toLowerCase()}`,
        timestamp: formatRelativeTime(date),
        icon: "APT",
        accent: "appointments",
        dateValue: date,
      });
    });

    return items
      .sort((a, b) => b.dateValue.getTime() - a.dateValue.getTime())
      .slice(0, 6)
      .map(({ dateValue: _date, ...rest }) => rest);
  }, [appointments, cases, sortedLabReports]);

  const firstName = getFirstNameFromUser(user);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <PatientNavbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-sm">Loading your dashboard…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            Mission Control
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="text-base text-muted-foreground">
            Here&apos;s what changed while you were away — and what we recommend tackling next.
          </p>
        </header>

        <section className="mt-8 space-y-8">
          <NeedsAttention items={attentionItems} loading={loading} />
          <CommandBar />
          <QuickAccessModules
            appointments={appointmentSummaries}
            activeCases={activeCasesSummary}
            recentActivity={recentActivity}
          />
          <CoreShortcuts />
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
