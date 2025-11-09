"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Calendar,
  FlaskConical,
  ClipboardList,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";

type AttentionCard = {
  id: string;
  type: "lab" | "case" | "appointment" | string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  cta?: {
    label: string;
    href: string;
  };
};

type CommandBar = {
  ghostText: string;
  suggestions: Array<{ label: string; prompt: string }>;
};

type QuickAccess = {
  upcomingAppointments?: Array<{
    id: string;
    provider?: string;
    date: string;
    status?: string;
    type?: string;
    confirmationCode?: string;
  }>;
  activeCases?: {
    count: number;
    estimatedSavings: number;
  };
  latestLab?: {
    title: string;
    date: string;
    doctor?: string | null;
    abnormalCount?: number;
  };
  recentActivity?: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
};

type Shortcut = {
  id: string;
  label: string;
  href: string;
};

type DashboardData = {
  userId: string;
  generatedAt: string;
  needsAttention: AttentionCard[];
  commandBar: CommandBar;
  quickAccess: QuickAccess;
  shortcuts: Shortcut[];
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [commandText, setCommandText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const payload = await response.json();
        if (isMounted) {
          setDashboard(payload.data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Unexpected error loading dashboard");
          setIsLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const attentionCards = dashboard?.needsAttention ?? [];
  const commandBar = dashboard?.commandBar;
  const quickAccess = dashboard?.quickAccess;
  const shortcuts = dashboard?.shortcuts ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="space-y-3">
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
            Mission Control
          </Badge>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-600">
              Here&apos;s what&apos;s new and what comes next across your care journey.
            </p>
          </div>
        </header>

        <section aria-labelledby="needs-attention">
          <div className="flex items-center justify-between mb-4">
            <h2 id="needs-attention" className="text-2xl font-semibold text-slate-900">
              Needs Your Attention
            </h2>
            <Badge variant="outline" className="text-slate-600">
              {attentionCards.length ? `${attentionCards.length} items` : "All clear"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={`skeleton-${index}`} className="border-2 border-dashed">
                  <CardContent className="py-10 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    Loading insight...
                  </CardContent>
                </Card>
              ))}

            {!isLoading && !attentionCards.length && (
              <Card className="border-2">
                <CardContent className="py-10 text-center text-slate-500">
                  You&apos;re all caught up. We&apos;ll flag anything that needs your review.
                </CardContent>
              </Card>
            )}

            {!isLoading &&
              attentionCards.map((item) => {
                const Icon =
                  item.type === "lab"
                    ? FlaskConical
                    : item.type === "appointment"
                    ? Calendar
                    : AlertTriangle;

                return (
                  <Card key={item.id} className="border-2 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-base font-semibold text-slate-900">
                          {item.title}
                        </CardTitle>
                      </div>
                      {item.metadata?.status && (
                        <Badge variant="secondary" className="capitalize">
                          {item.metadata.status}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="text-slate-600 space-y-3">
                      <p>{item.body}</p>
                      {item.metadata?.amountYouOwe !== undefined && (
                        <p className="text-sm text-slate-500">
                          Amount you owe:{" "}
                          <span className="font-semibold text-slate-700">
                            ${item.metadata.amountYouOwe?.toFixed(2)}
                          </span>
                        </p>
                      )}
                    </CardContent>
                    {item.cta && (
                      <CardFooter>
                        <Button asChild variant="link" className="px-0 text-blue-600 hover:text-blue-700">
                          <Link href={item.cta.href}>
                            {item.cta.label}
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
          </div>
        </section>

        <section aria-labelledby="command-bar">
          <Card className="border-2 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle id="command-bar" className="text-xl font-semibold text-slate-900">
                  Command Bar
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Start something new or ask CarePilot to take the next step for you.
                </p>
              </div>
              <div className="flex-1 max-w-xl">
                <Input
                  placeholder={commandBar?.ghostText || "How can I help? (e.g., \"Explain my labs\")"}
                  value={commandText}
                  onChange={(event) => setCommandText(event.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </CardHeader>
            {commandBar?.suggestions?.length ? (
              <CardFooter className="flex flex-wrap gap-2">
                {commandBar.suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setCommandText(suggestion.prompt)}
                  >
                    {suggestion.label}
                  </Button>
                ))}
              </CardFooter>
            ) : null}
          </Card>
        </section>

        <section aria-labelledby="quick-access" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-2 h-full">
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <CardTitle id="quick-access" className="text-xl font-semibold text-slate-900">
                    Upcoming Appointments
                  </CardTitle>
                </div>
                <Badge variant="outline">
                  {quickAccess?.upcomingAppointments?.length || 0} scheduled
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickAccess?.upcomingAppointments?.length ? (
                  quickAccess.upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-start justify-between rounded-lg border bg-slate-50 p-4"
                    >
                      <div>
                        <p className="text-sm text-slate-500">With</p>
                        <p className="font-semibold text-slate-800">{appointment.provider}</p>
                        <p className="text-sm text-slate-500 capitalize">{appointment.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">
                          {new Date(appointment.date).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm text-slate-500 capitalize">{appointment.status}</p>
                        {appointment.confirmationCode && (
                          <p className="text-xs text-slate-400 mt-1">
                            {appointment.confirmationCode}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No appointments scheduled. Ask the command bar to book your next visit.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl font-semibold text-slate-900">Active Cases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">In progress</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {quickAccess?.activeCases?.count ?? 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Estimated savings</p>
                    <p className="text-2xl font-semibold text-emerald-600">
                      $
                      {(quickAccess?.activeCases?.estimatedSavings ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href="/features/claims">Review active disputes</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-2">
              <CardHeader className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl font-semibold text-slate-900">Latest Lab Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickAccess?.latestLab ? (
                  <>
                    <p className="text-sm text-slate-500">{quickAccess.latestLab.title}</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {new Date(quickAccess.latestLab.date).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {quickAccess.latestLab.doctor && (
                      <p className="text-sm text-slate-500">Ordering physician: {quickAccess.latestLab.doctor}</p>
                    )}
                    <Badge variant="secondary" className="w-fit">
                      {quickAccess.latestLab.abnormalCount ?? 0} parameters flagged
                    </Badge>
                    <Button asChild variant="outline" className="mt-3">
                      <Link href="/features/lab-analysis">View analysis</Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    No lab reports yet. Upload one to see trends and plain-English explanations.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl font-semibold text-slate-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickAccess?.recentActivity?.length ? (
                  quickAccess.recentActivity.map((activity) => (
                    <div key={activity.id} className="border-b pb-3 last:border-none last:pb-0">
                      <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(activity.date).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No recent activity recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="shortcuts">
          <div className="flex items-center justify-between mb-4">
            <h2 id="shortcuts" className="text-2xl font-semibold text-slate-900">
              Core Task Shortcuts
            </h2>
            <p className="text-sm text-slate-500">
              Prefer buttons? Jump straight into the four pillars.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {shortcuts.map((shortcut) => (
              <Button key={shortcut.id} asChild size="lg" className="h-16 text-base font-semibold">
                <Link href={shortcut.href}>{shortcut.label}</Link>
              </Button>
            ))}
          </div>
        </section>

        {error ? (
          <section>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-6">
                <p className="text-red-700 font-medium">Dashboard error: {error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Try refreshing. If the issue persists, contact support.
                </p>
              </CardContent>
            </Card>
          </section>
        ) : null}
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
