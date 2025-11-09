"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell, Settings, LogOut } from "lucide-react";
import { FEATURES, ROUTES } from "@/lib/constants";

export function PatientNavbar() {
  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href={ROUTES.PATIENT} className="text-xl font-bold text-blue-600">
              CarePilot
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {FEATURES.map((feature) => (
                <a
                  key={feature.id}
                  href={`#${feature.id}`}
                  className="text-gray-700 hover:text-blue-600 transition-colors scroll-smooth"
                >
                  {feature.title}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Settings">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="/auth/logout">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

