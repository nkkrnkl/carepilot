"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDashboardUrl } from '@/lib/navigation';
import { 
  Beaker,
  FileText,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { FEATURES } from "@/lib/constants";

const featureDetails = [
  {
    title: "Lab Analysis",
    description: "Parse complex lab results with AI precision, extracting key metrics and flagging anomalies instantly. Identify trends across multiple tests over time, revealing patterns that might go unnoticed. Translate medical jargon into plain-English context that's easy to understand.",
    icon: Beaker,
    link: "/features/lab-analysis",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    hoverBorder: "hover:border-blue-400"
  },
  {
    title: "Case Management",
    description: "Track and manage all your bills, EOBs, and claims in one place. Review cases, track progress, and take action when needed. View relevant documents, audit trails, and next steps for each case. Pay bills or appeal claims with a single click. Get alerts for high amounts, overdue payments, and discrepancies. Monitor case status in real-time with detailed timelines and automated follow-ups.",
    icon: FileText,
    link: "/features/cases",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    borderColor: "border-purple-200",
    hoverBorder: "hover:border-purple-400"
  }
];

export default function Overview() {
  const dashboardUrl = useDashboardUrl();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-100/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Header Section */}
        <div className="mb-12">
          <div className="mb-6">
            <Button asChild variant="outline" className="mb-6">
              <Link href={dashboardUrl}>← Back to Dashboard</Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Overview
              </h1>
              <p className="text-sm text-gray-500 mt-1">CarePilot Features</p>
            </div>
          </div>
          
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
          {featureDetails.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className={`group relative overflow-hidden border-2 ${feature.borderColor} ${feature.hoverBorder} bg-gradient-to-br ${feature.bgGradient} shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                {/* Gradient Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 group-hover:opacity-20 rounded-full -mr-16 -mt-16 transition-opacity duration-300`}></div>
                
                <CardHeader className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`${feature.iconBg} ${feature.iconColor} h-14 w-14 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                          {feature.title}
                        </CardTitle>
                        <Badge className={`${feature.iconBg} ${feature.iconColor} border-0`}>
                          Feature {index + 1}
                        </Badge>
                      </div>
                    </div>
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
                
                {/* Decorative corner element */}
                <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl ${feature.gradient} opacity-5 rounded-tl-full`}></div>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
              Explore each feature in detail and see how CarePilot can streamline your healthcare experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Link href={dashboardUrl}>Back to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white/10">
                <Link href="/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
