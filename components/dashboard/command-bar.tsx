"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SuggestedAction = {
  label: string;
  description: string;
  href: string;
  keywords: string[];
};

const SUGGESTED_ACTIONS: SuggestedAction[] = [
  {
    label: "Analyze Labs",
    description: "Upload a PDF and get plain-English insights",
    href: "/features/lab-analysis",
    keywords: ["lab", "labs", "report", "a1c", "cholesterol", "results", "analysis"],
  },
  {
    label: "Dispute a Bill",
    description: "Review mismatches and start an appeal",
    href: "/features/cases",
    keywords: ["bill", "billing", "eob", "dispute", "appeal", "claim"],
  },
  {
    label: "Schedule Appointment",
    description: "Find appointments that fit your schedule",
    href: "/features/scheduling",
    keywords: ["schedule", "appointment", "book", "doctor", "visit"],
  },
  {
    label: "Review Active Cases",
    description: "Track ongoing negotiations and cases",
    href: "/features/cases",
    keywords: ["case", "cases", "active", "status", "track"],
  },
];

export function CommandBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focusedSuggestion, setFocusedSuggestion] = useState<string | null>(null);

  const matchingSuggestions = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term) return SUGGESTED_ACTIONS.slice(0, 3);

    const results = SUGGESTED_ACTIONS.filter((action) =>
      action.keywords.some((keyword) => keyword.includes(term) || term.includes(keyword))
    );

    return results.length ? results : SUGGESTED_ACTIONS.slice(0, 2);
  }, [value]);

  function handleSubmit(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    const directSuggestion = matchingSuggestions[0];
    if (directSuggestion) {
      router.push(directSuggestion.href);
      setValue("");
      return;
    }

    if (value.trim()) {
      router.push(`/features?search=${encodeURIComponent(value.trim())}`);
      setValue("");
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-muted bg-white p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setFocusedSuggestion(null);
              }}
              placeholder="How can I help? (e.g., “Book a physical”, “Dispute this bill”, “Explain my labs”)"
              className="h-12 w-full rounded-xl border-muted pl-10 pr-4 text-base"
            />
          </div>
          <Button
            type="submit"
            className="h-12 rounded-xl px-5 text-base font-semibold md:w-auto"
          >
            Ask CarePilot
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide">
            <Command className="h-3.5 w-3.5" />
            Suggested Prompts
          </span>
          {matchingSuggestions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group flex items-center gap-2 rounded-full border border-transparent bg-muted/60 px-3 py-1 text-xs transition-colors hover:border-muted-foreground/20 hover:bg-muted",
                focusedSuggestion === action.href && "border-primary/40 bg-primary/10 text-primary"
              )}
              onMouseEnter={() => setFocusedSuggestion(action.href)}
              onMouseLeave={() => setFocusedSuggestion(null)}
            >
              <span className="font-medium text-muted-foreground group-hover:text-foreground">
                {action.label}
              </span>
              <span className="hidden text-muted-foreground group-hover:text-foreground md:inline">
                — {action.description}
              </span>
            </Link>
          ))}
        </div>
      </form>
    </div>
  );
}
