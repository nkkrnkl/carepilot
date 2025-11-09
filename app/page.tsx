"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FeatureCard } from "@/components/feature-card";
import { HeroSection } from "@/components/sections/hero-section";
import { BenefitsSection } from "@/components/sections/benefits-section";
import { CTASection } from "@/components/sections/cta-section";
import { DocumentUploadSimple } from "@/components/documents/document-upload-simple";
import { FEATURES, ROUTES } from "@/lib/constants";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [scrollY, setScrollY] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [checkingRole, setCheckingRole] = useState(false);
  const hasCheckedRole = useRef(false);

  // Check if user is logged in and redirect to appropriate dashboard
  useEffect(() => {
    async function checkUserAndRedirect() {
      // Don't redirect while Auth0 is loading
      if (isLoading) return;
      
      // Prevent multiple simultaneous checks
      if (hasCheckedRole.current) return;
      
      // Only redirect if user is logged in
      if (user && user.email) {
        hasCheckedRole.current = true;
        setCheckingRole(true);
        try {
          // Check if user has a role set in database
          // Try the role API endpoint first
          try {
            const response = await fetch(`/api/users/role?email=${encodeURIComponent(user.email)}`);
            
            if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.role) {
            // User has a role, redirect to appropriate dashboard immediately
            window.location.href = data.role === "doctor" ? "/doctorportal" : "/patient";
            return;
          }
            }
          } catch (roleError) {
            console.warn("Error fetching role from API:", roleError);
            // Continue to fallback
          }
          
          // Fallback: Check if user exists in database with role
          try {
          const userResponse = await fetch(`/api/users?emailAddress=${encodeURIComponent(user.email)}`);
          
            if (userResponse.ok) {
          const userData = await userResponse.json();
          
          if (userData.success && userData.user?.userRole) {
            // User has a role, redirect to appropriate dashboard immediately
            window.location.href = userData.user.userRole === "doctor" ? "/doctorportal" : "/patient";
            return;
              }
            }
          } catch (userError) {
            console.warn("Error fetching user from API:", userError);
            // Continue to role selection
          }
          
          // User is logged in but has no role - redirect to sign-in page to select role
          // This will show the role selection UI
          window.location.href = "/signin";
        } catch (error) {
          console.error("Error checking user role:", error);
          // On error, don't redirect - just show landing page
          setCheckingRole(false);
          hasCheckedRole.current = false; // Allow retry on error
        }
      } else {
        // User is not logged in, stay on landing page
        setCheckingRole(false);
        hasCheckedRole.current = false; // Reset when user logs out
      }
    }
    
    checkUserAndRedirect();
  }, [user, isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show loading state while checking authentication
  if (isLoading || (user && checkingRole)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
        description="CarePilot is an AI agent that handles key healthcare tasks to streamline your experience. From analyzing lab results to managing bills, EOBs, and claims—we automate the complex so you can focus on what matters."
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
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

      {/* Document Upload Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Documents</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload PDF documents to be processed, chunked, and stored in our vector database for intelligent retrieval
          </p>
        </div>
        <DocumentUploadSimple 
          userId="user-123"
          onUploadComplete={(file) => {
            console.log("Upload complete:", file);
          }}
        />
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
