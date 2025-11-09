"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Settings, User, LogOut } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: ROUTES.PATIENT, label: "Dashboard" },
  { href: ROUTES.FEATURES.LAB_ANALYSIS, label: "Labs" },
  { href: "/features/scheduling", label: "Scheduling" },
  { href: ROUTES.FEATURES.CASES, label: "Billing & Claims" },
];

export function PatientNavbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href={ROUTES.PATIENT} className="text-xl font-bold text-blue-600">
            CarePilot
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== ROUTES.PATIENT && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "text-blue-600"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Settings">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Link href="/profile" className="cursor-pointer">
            <Avatar className="transition-all hover:ring-2 hover:ring-blue-500">
              <AvatarFallback className="bg-blue-600 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

