"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Beaker,
  Calendar,
  FileText,
  Receipt,
  ArrowRight
} from "lucide-react";

const features = [
  {
    title: "Lab Analysis",
    description: "Parse complex lab results with AI precision, extracting key metrics and flagging anomalies instantly. Identify trends across multiple tests over time, revealing patterns that might go unnoticed. Translate medical jargon into plain-English context that's easy to understand. Get actionable insights that help you understand your health metrics at a glance, with historical comparisons and expert-level interpretation. Track progress, set health goals, and receive personalized recommendations based on your unique test results.",
    icon: Beaker,
    link: "#lab-demo"
  },
  {
    title: "Scheduling",
    description: "Navigate in-network providers effortlessly with a comprehensive database of healthcare professionals. Find available appointments that fit your schedule with real-time availability updates across multiple providers. Receive intelligent reminders for upcoming visits, prescription renewals, and follow-ups tailored to your preferences. Coordinate multiple appointments efficiently, avoiding scheduling conflicts. Never miss an important medical appointment again with automated calendar synchronization and smart notification systems.",
    icon: Calendar,
    link: "#scheduling-demo"
  },
  {
    title: "Bill Negotiation",
    description: "Automatically detect billing discrepancies and overcharges by comparing your medical bills against industry standards and historical pricing data. Get the right price for medical services with data-driven negotiation support that provides evidence-based arguments. Review pre-drafted dispute letters and appeals before submission, customized to your specific situation. Track negotiation progress and outcomes, learning what works best for different types of charges. Save time and money on healthcare costs while ensuring you're not overpaying.",
    icon: Receipt,
    link: "#bill-demo"
  },
  {
    title: "Claims",
    description: "Pre-check claims for accuracy before submission to avoid rejections and delays. Verify that all required information is complete and correctly formatted according to your insurance provider's requirements. Ensure clean claims that get processed quickly on first submission, reducing administrative burden. Handle appeals efficiently with automated status tracking and deadline reminders. Stay informed about every step of your insurance claims process with real-time updates and detailed explanations of any issues that arise.",
    icon: FileText,
    link: "#claims-demo"
  }
];

export default function Overview() {
  return (
    <div className="min-h-screen bg-white p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Button asChild variant="outline">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Main Heading */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Overview</h1>
          
          {/* CarePilot Description */}
          <p className="text-lg text-gray-700 leading-relaxed max-w-4xl">
            CarePilot is an AI agent handling four high-leverage tasks that streamline your healthcare experience. 
            From analyzing lab results and managing appointments to negotiating bills and processing claims, CarePilot 
            automates the complex, time-consuming aspects of healthcare administration. Every action is fully auditable 
            and requires user approval, ensuring you maintain complete control while benefiting from intelligent automation.
          </p>
        </div>

        {/* Four Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed mb-4">
                    {feature.description}
                  </CardDescription>
                  <Button asChild variant="link" className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700">
                    <Link href={feature.link} className="flex items-center gap-1">
                      See it in demo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

