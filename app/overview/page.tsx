"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Beaker,
  FileText,
  ArrowRight
} from "lucide-react";

const features = [
  {
    title: "Lab Analysis",
    description: "Parse complex lab results with AI precision, extracting key metrics and flagging anomalies instantly. Identify trends across multiple tests over time, revealing patterns that might go unnoticed. Translate medical jargon into plain-English context that's easy to understand. Get actionable insights that help you understand your health metrics at a glance, with historical comparisons and expert-level interpretation. Track progress, set health goals, and receive personalized recommendations based on your unique test results.",
    icon: Beaker,
    link: "/features/lab-analysis"
  },
  {
    title: "Case Management",
    description: "Track and manage all your bills, EOBs, and claims in one place. Review cases, track progress, and take action when needed. View relevant documents, audit trails, and next steps for each case. Pay bills or appeal claims with a single click. Get alerts for high amounts, overdue payments, and discrepancies. Monitor case status in real-time with detailed timelines and automated follow-ups.",
    icon: FileText,
    link: "/features/cases"
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
            CarePilot is an AI agent handling key healthcare tasks that streamline your experience. 
            From analyzing lab results to managing bills, EOBs, and claims, CarePilot 
            automates the complex, time-consuming aspects of healthcare administration. Every action is fully auditable 
            and requires user approval, ensuring you maintain complete control while benefiting from intelligent automation.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
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
                      Explore feature
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

