"use client";

import Link from "next/link";
import {
  CalendarPlus,
  FileCheck2,
  FileSearch,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Shortcut = {
  label: string;
  href: string;
  description: string;
  icon: React.ReactNode;
  tone: "blue" | "purple" | "green" | "amber";
};

const toneStyles: Record<Shortcut["tone"], string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
  purple:
    "border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800",
  green:
    "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
  amber:
    "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800",
};

const SHORTCUTS: Shortcut[] = [
  {
    label: "Analyze Labs",
    href: "/features/lab-analysis",
    description: "Upload PDF lab reports",
    icon: <FlaskConical className="h-4 w-4" />,
    tone: "blue",
  },
  {
    label: "Schedule Visit",
    href: "/features/scheduling",
    description: "Book a doctor appointment",
    icon: <CalendarPlus className="h-4 w-4" />,
    tone: "green",
  },
  {
    label: "Review Bill",
    href: "/features/cases",
    description: "Compare bill vs. EOB",
    icon: <FileSearch className="h-4 w-4" />,
    tone: "amber",
  },
  {
    label: "Manage Claim",
    href: "/features/cases",
    description: "Track disputes & appeals",
    icon: <FileCheck2 className="h-4 w-4" />,
    tone: "purple",
  },
];

export function CoreShortcuts() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {SHORTCUTS.map((shortcut) => (
        <Button
          key={shortcut.href}
          asChild
          variant="outline"
          className={cn(
            "flex h-auto flex-col items-start gap-1 rounded-2xl border-2 px-4 py-4 text-left transition-all",
            toneStyles[shortcut.tone]
          )}
        >
          <Link href={shortcut.href}>
            <span className="flex items-center gap-2 text-sm font-semibold">
              {shortcut.icon}
              {shortcut.label}
            </span>
            <span className="text-xs font-normal text-current/80">
              {shortcut.description}
            </span>
          </Link>
        </Button>
      ))}
    </div>
  );
}
