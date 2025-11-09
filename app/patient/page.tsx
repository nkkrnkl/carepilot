"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientNavbar } from "@/components/layout/patient-navbar";
import { FeatureCard } from "@/components/feature-card";
import { FEATURES } from "@/lib/constants";
import { Calendar, Clock, MapPin, Stethoscope, ArrowRight } from "lucide-react";
import Link from "next/link";

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
        {/* Upcoming Appointment Section */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  Upcoming Appointment
                </CardTitle>
                <CardDescription className="mt-1 text-gray-600">
                  Your next scheduled visit
                </CardDescription>
              </div>
              <Badge className="bg-blue-600 text-white border-0">
                Confirmed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Doctor Information */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Dr. Emily Rodriguez
                    </h3>
                    <p className="text-gray-600 font-medium mb-3">
                      Endocrinology
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">Tuesday, Nov 12</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-semibold">8:00 AM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span>789 Wellness St, Cambridge, MA 02140</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="flex items-center justify-end md:justify-start">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/features/scheduling" className="flex items-center gap-2">
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Cards */}
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
    </div>
  );
}
