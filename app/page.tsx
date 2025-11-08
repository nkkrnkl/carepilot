"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FeatureCard } from "@/components/feature-card";
import { HeroSection } from "@/components/sections/hero-section";
import { BenefitsSection } from "@/components/sections/benefits-section";
import { CTASection } from "@/components/sections/cta-section";
import { FEATURES, ROUTES } from "@/lib/constants";
import { Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <HeroSection
        badge={{
          text: "AI-Powered Healthcare Assistant",
          icon: <Sparkles className="h-4 w-4" />,
        }}
        title={{
          primary: "CarePilot",
          secondary: "Your Healthcare Navigation System",
          secondaryColor: "text-blue-600",
        }}
        description="CarePilot is an AI agent that handles four high-leverage tasks to streamline your healthcare experience. From analyzing lab results to managing appointments, negotiating bills, and processing claims—we automate the complex so you can focus on what matters."
        cta={{
          primary: {
            text: "Explore Features",
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Four Powerful Features</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to navigate healthcare with confidence
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          text: "Explore Features",
          href: "#features",
        }}
      />

      <Footer />
    </div>
  );
}
