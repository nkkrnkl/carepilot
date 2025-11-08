"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  MapPin,
  Clock,
  Bell,
  CheckCircle2,
  ArrowLeft,
  Search,
  CalendarCheck
} from "lucide-react";

const capabilities = [
  {
    title: "Find In-Network Options",
    description: "Search and filter providers based on your insurance network coverage to avoid surprise bills.",
    icon: Search
  },
  {
    title: "Match Availability",
    description: "See real-time availability across providers and find appointments that fit your schedule.",
    icon: Clock
  },
  {
    title: "Location Matching",
    description: "Filter providers by location, distance, and convenience to find the best options near you.",
    icon: MapPin
  },
  {
    title: "Place Appointments",
    description: "Schedule appointments directly through CarePilot with automatic confirmation and calendar sync.",
    icon: CalendarCheck
  },
  {
    title: "Confirm Appointments",
    description: "Receive automatic confirmations and reminders to ensure you never miss an appointment.",
    icon: CheckCircle2
  },
  {
    title: "Prep Reminders",
    description: "Get intelligent reminders for appointment preparation, including fasting requirements and documents needed.",
    icon: Bell
  }
];

export default function SchedulingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-green-600" />
                <span className="text-xl font-bold text-gray-900">Scheduling</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700">Feature</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Scheduling
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find in-network options, match availability and location, place and confirm appointments, and set prep reminders. 
            Streamline your healthcare scheduling with intelligent automation that saves you time and ensures you get the care you need.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <Card key={index} className="border-2 hover:border-green-300 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{capability.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {capability.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <Card className="border-2 border-green-200 bg-green-50/50 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Search In-Network Providers</h3>
                  <p className="text-gray-600">
                    Enter your specialty, location, and insurance information. CarePilot finds all in-network providers 
                    that match your criteria.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Match Availability & Location</h3>
                  <p className="text-gray-600">
                    View real-time availability and filter by distance, convenience, and your preferred times. 
                    See all options in one place.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Schedule & Set Reminders</h3>
                  <p className="text-gray-600">
                    Place appointments with automatic confirmation. Receive prep reminders including fasting requirements, 
                    documents needed, and preparation instructions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Time Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                No more calling multiple offices or checking multiple websites. Find and schedule appointments in minutes.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Cost Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Always stay in-network to avoid surprise bills and ensure your insurance covers your appointments.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Never Miss</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automated reminders and calendar sync ensure you're always prepared and never miss an important appointment.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

