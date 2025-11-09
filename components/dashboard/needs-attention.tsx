"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export type AttentionSeverity = "info" | "warning" | "critical";

export type AttentionItem = {
  id: string;
  title: string;
  description: string;
  summary?: string;
  icon: ReactNode;
  severity: AttentionSeverity;
  timestamp?: string;
  action: {
    label: string;
    href: string;
  };
};

const severityStyles: Record<
  AttentionSeverity,
  { badge: string; border: string; accent: string }
> = {
  info: {
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    border: "border border-blue-100",
    accent: "text-blue-600",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    border: "border border-amber-200",
    accent: "text-amber-600",
  },
  critical: {
    badge: "bg-rose-50 text-rose-700 border border-rose-200",
    border: "border border-rose-200",
    accent: "text-rose-600",
  },
};

type NeedsAttentionProps = {
  items: AttentionItem[];
  loading?: boolean;
};

export function NeedsAttention({ items, loading }: NeedsAttentionProps) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="border border-muted">
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-9 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-white">
        <CardContent className="py-10 text-center space-y-2">
          <p className="text-lg font-semibold text-gray-900">All caught up!</p>
          <p className="text-sm text-muted-foreground">
            We&apos;ll surface anything that needs your review right here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => {
        const styles = severityStyles[item.severity];
        return (
          <Card key={item.id} className={`h-full ${styles.border}`}>
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center gap-3">
                <Badge className={styles.badge}>
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Needs Attention
                  </span>
                </Badge>
                {item.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {item.timestamp}
                  </span>
                )}
              </div>
              <CardTitle className="flex items-start gap-3 text-xl">
                <span className={`mt-1 text-xl ${styles.accent}`}>{item.icon}</span>
                <span>{item.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              {item.summary && (
                <div className="rounded-md border border-dashed border-muted bg-muted/20 p-3 text-sm text-muted-foreground">
                  {item.summary}
                </div>
              )}
              <Button asChild className="self-start">
                <Link href={item.action.href}>{item.action.label}</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
