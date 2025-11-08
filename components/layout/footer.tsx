import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/constants";

interface FooterProps {
  variant?: "default" | "minimal";
}

export function Footer({ variant = "default" }: FooterProps) {
  return (
    <footer className="border-t bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CarePilot</span>
          </div>
          {variant === "default" && (
            <div className="flex gap-6 text-gray-600">
              <Link href={ROUTES.OVERVIEW} className="hover:text-blue-600 transition-colors">
                Overview
              </Link>
              <Link href={ROUTES.FEATURES.LAB_ANALYSIS} className="hover:text-blue-600 transition-colors">
                Features
              </Link>
              <Link href={ROUTES.SIGNIN} className="hover:text-blue-600 transition-colors">
                Sign In
              </Link>
            </div>
          )}
        </div>
        <div className="mt-8 pt-8 border-t text-center text-gray-500 text-sm">
          <p>© 2024 CarePilot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

