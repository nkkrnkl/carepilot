"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { PatientNavbar } from "@/components/layout/patient-navbar";
import { Footer } from "@/components/layout/footer";
import { FeatureCard } from "@/components/feature-card";
import { HeroSection } from "@/components/sections/hero-section";
import { BenefitsSection } from "@/components/sections/benefits-section";
import { CTASection } from "@/components/sections/cta-section";
import { FEATURES, ROUTES } from "@/lib/constants";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Redirect authenticated users to dashboard on initial direct visit
  // But allow intentional navigation to landing page via "Home" link
  useEffect(() => {
    if (!isLoading && user) {
      // Check if user intentionally navigated here (via Home link)
      const wantLandingPage = sessionStorage.getItem('wantLandingPage');
      
      if (wantLandingPage) {
        // User clicked "Home" link - allow them to see landing page
        // Clear the flag after a short delay to prevent re-setting on re-render
        setTimeout(() => {
          sessionStorage.removeItem('wantLandingPage');
        }, 100);
      } else {
        // Direct visit or page refresh - redirect to dashboard
        // Use a small delay to check if this is a navigation event
        const timeoutId = setTimeout(() => {
          // Double-check flag wasn't set during the delay (user might have clicked Home quickly)
          const stillWantLanding = sessionStorage.getItem('wantLandingPage');
          if (!stillWantLanding) {
            setShouldRedirect(true);
            router.push(ROUTES.PATIENT);
          }
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show loading state while checking auth or redirecting
  if (isLoading || (user && shouldRedirect)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Use PatientNavbar if user is authenticated, otherwise use regular Navbar
  const NavbarComponent = user ? PatientNavbar : Navbar;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <NavbarComponent />

      <HeroSection
        badge={{
          text: "AI-Powered Healthcare Assistant",
          icon: <Sparkles className="h-4 w-4" />,
        }}
        title={{
          primary: "CarePilot",
          secondary: "Your copilot for health",
          secondaryColor: "text-blue-600",
        }}
        description="CarePilot is an AI agent that handles key healthcare tasks to streamline your experience. From analyzing lab results to managing bills, EOBs, and claims—we automate the complex so you can focus on what matters."
        cta={{
          primary: {
            text: "Explore Services",
            href: "#features",
          },
          secondary: {
            text: "Learn More",
            href: ROUTES.OVERVIEW,
          },
        }}
      />

      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Services</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to navigate healthcare with confidence
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      <BenefitsSection />

      <CTASection
        title="Ready to Simplify Your Healthcare?"
        description="Start exploring CarePilot's features and see how we can help you navigate healthcare with ease."
        primaryAction={{
          text: "View Overview",
          href: ROUTES.OVERVIEW,
        }}
        secondaryAction={{
          text: "Explore Services",
          href: "#features",
        }}
      />

      <Footer />
    </div>
  );
}
