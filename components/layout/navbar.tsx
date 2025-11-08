import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface NavbarProps {
  showAuth?: boolean;
  variant?: "default" | "patient" | "doctor";
  navLinks?: { href: string; label: string }[];
}

export function Navbar({ showAuth = true, variant = "default", navLinks }: NavbarProps) {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300 hover:bg-white/95 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-105">
              <Sparkles className="h-6 w-6 text-blue-600 transition-transform duration-300 group-hover:rotate-12" />
              <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">CarePilot</span>
            </Link>
            {navLinks && (
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-gray-700 hover:text-blue-600 transition-colors scroll-smooth"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {showAuth && (
            <div className="flex items-center gap-4">
              {variant === "default" && (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/overview">Overview</Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

