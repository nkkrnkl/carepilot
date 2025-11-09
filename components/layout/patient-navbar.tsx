"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { FEATURES, ROUTES } from "@/lib/constants";

export function PatientNavbar() {
  const pathname = usePathname();

  // Helper function to check if a link is active
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            {/* Logo - links to landing page (home) */}
            <Link 
              href={ROUTES.LANDING}
              onClick={() => {
                // Set flag to indicate user wants to visit landing page
                sessionStorage.setItem('wantLandingPage', 'true');
              }}
              className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              CarePilot
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {/* Dashboard Link */}
              <Link
                href={ROUTES.PATIENT}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(ROUTES.PATIENT)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              {/* Feature Links */}
              {FEATURES.map((feature) => (
                <Link
                  key={feature.id}
                  href={feature.link}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(feature.link)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  {feature.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications" title="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Settings" title="Settings">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" title="Sign Out">
              <a href="/auth/logout" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

