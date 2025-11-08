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
import { useEffect, useRef, useState } from "react";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
          style={{ transform: `translate(${scrollY * 0.02}px, ${scrollY * 0.02}px)` }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
          style={{ transform: `translate(${-scrollY * 0.02}px, ${scrollY * 0.03}px)` }}
        />
        <div 
          className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
          style={{ transform: `translate(${scrollY * 0.01}px, ${-scrollY * 0.02}px)` }}
        />
      </div>

      <Navbar />

      <HeroSection
        badge={{
          text: "AI-Powered Healthcare Assistant",
          icon: <Sparkles className="h-4 w-4" />,
        }}
        title={{
          primary: "CarePilot",
          secondary: "Your Personal Health Co-Pilot",
          secondaryColor: "text-blue-600",
        }}
        description="Simplifies healthcare by handling what matters most—analyzing labs, booking appointments, negotiating bills, and managing claims—so you can focus on your health, not the paperwork."
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

      <section 
        ref={featuresRef}
        id="features" 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            Four Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to navigate healthcare with confidence
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((feature, index) => (
            <FeatureCard 
              key={feature.id} 
              feature={feature} 
              index={index}
            />
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
