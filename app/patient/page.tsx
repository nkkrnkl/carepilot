"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PatientNavbar } from "@/components/layout/patient-navbar";
import { FeatureCard } from "@/components/feature-card";
import { Footer } from "@/components/layout/footer";
import { FEATURES, ROUTES } from "@/lib/constants";

export default function PatientDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 scroll-smooth">
      <PatientNavbar />

      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, Patient</h1>
              <p className="text-blue-100">Manage your healthcare with ease</p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
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
