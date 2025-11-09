"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PatientNavbar } from "@/components/layout/patient-navbar";
import { FeatureCard } from "@/components/feature-card";
import { Footer } from "@/components/layout/footer";
import { FEATURES, ROUTES } from "@/lib/constants";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function PatientDashboard() {
  const { user } = useUser();
  const [patientName, setPatientName] = useState<string>("Patient");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPatientName() {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users?emailAddress=${encodeURIComponent(user.email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            const firstName = data.user.FirstName || "";
            const lastName = data.user.LastName || "";
            if (firstName || lastName) {
              setPatientName(firstName || lastName);
            } else {
              // Fallback to email name or "Patient"
              const emailName = user.email?.split("@")[0] || "Patient";
              setPatientName(emailName);
            }
          } else {
            // User doesn't exist in database, use email name or "Patient"
            const emailName = user.email?.split("@")[0] || "Patient";
            setPatientName(emailName);
          }
        }
      } catch (error) {
        console.error("Error loading patient name:", error);
        // Fallback to email name or "Patient"
        const emailName = user.email?.split("@")[0] || "Patient";
        setPatientName(emailName);
      } finally {
        setIsLoading(false);
      }
    }

    loadPatientName();
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-gray-50 scroll-smooth">
      <PatientNavbar />

      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {isLoading ? "Patient" : patientName}
              </h1>
              <p className="text-blue-100">Manage your healthcare with ease</p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              Active Member
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {FEATURES.map((feature) => (
          <section
            key={feature.id}
            id={feature.id}
            className="mb-16 scroll-mt-20"
          >
            <FeatureCard
              feature={feature}
              variant="detailed"
              showLearnMore={true}
            />
          </section>
        ))}
      </div>

      <Footer variant="minimal" />
    </div>
  );
}
