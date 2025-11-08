"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Beaker,
  Calendar,
  FileText,
  Receipt,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Shield,
  Zap
} from "lucide-react";
import { FEATURES } from "@/lib/constants";

const featureDetails = [
  {
    title: "Lab Analysis",
    description: "Parse complex lab results with AI precision, extracting key metrics and flagging anomalies instantly. Identify trends across multiple tests over time, revealing patterns that might go unnoticed. Translate medical jargon into plain-English context that's easy to understand. Get actionable insights that help you understand your health metrics at a glance, with historical comparisons and expert-level interpretation. Track progress, set health goals, and receive personalized recommendations based on your unique test results.",
    icon: Beaker,
    link: "/features/lab-analysis",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    textColor: "text-blue-600"
  },
  {
    title: "Scheduling",
    description: "Navigate in-network providers effortlessly with a comprehensive database of healthcare professionals. Find available appointments that fit your schedule with real-time availability updates across multiple providers. Receive intelligent reminders for upcoming visits, prescription renewals, and follow-ups tailored to your preferences. Coordinate multiple appointments efficiently, avoiding scheduling conflicts. Never miss an important medical appointment again with automated calendar synchronization and smart notification systems.",
    icon: Calendar,
    link: "/features/scheduling",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    borderColor: "border-green-200",
    hoverBorder: "hover:border-green-400",
    buttonColor: "bg-green-600 hover:bg-green-700",
    textColor: "text-green-600"
  },
  {
    title: "Bill Negotiation",
    description: "Automatically detect billing discrepancies and overcharges by comparing your medical bills against industry standards and historical pricing data. Get the right price for medical services with data-driven negotiation support that provides evidence-based arguments. Review pre-drafted dispute letters and appeals before submission, customized to your specific situation. Track negotiation progress and outcomes, learning what works best for different types of charges. Save time and money on healthcare costs while ensuring you're not overpaying.",
    icon: Receipt,
    link: "/features/bill-negotiation",
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-50 to-amber-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    borderColor: "border-orange-200",
    hoverBorder: "hover:border-orange-400",
    buttonColor: "bg-orange-600 hover:bg-orange-700",
    textColor: "text-orange-600"
  },
  {
    title: "Claims",
    description: "Pre-check claims for accuracy before submission to avoid rejections and delays. Verify that all required information is complete and correctly formatted according to your insurance provider's requirements. Ensure clean claims that get processed quickly on first submission, reducing administrative burden. Handle appeals efficiently with automated status tracking and deadline reminders. Stay informed about every step of your insurance claims process with real-time updates and detailed explanations of any issues that arise.",
    icon: FileText,
    link: "/features/claims",
    gradient: "from-indigo-500 to-blue-600",
    bgGradient: "from-indigo-50 to-blue-50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    borderColor: "border-indigo-200",
    hoverBorder: "hover:border-indigo-400",
    buttonColor: "bg-indigo-600 hover:bg-indigo-700",
    textColor: "text-indigo-600"
  }
];

export default function Overview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-100/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Header Section */}
        <div className="mb-12">
          <div className="mb-6">
            <Button asChild variant="outline" className="mb-6">
              <Link href="/">← Back to Dashboard</Link>
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
          <div className="bg-white/80 backdrop-blur-sm border-2 border-blue-100 rounded-2xl p-6 shadow-lg">
            <div className="max-w-4xl">
              <p className="text-lg text-gray-700 leading-relaxed text-left">
                CarePilot is an AI agent handling four high-leverage tasks that streamline your healthcare experience. 
                From analyzing lab results and managing appointments to negotiating bills and processing claims, CarePilot 
                automates the complex, time-consuming aspects of healthcare administration. Every action is fully auditable 
                and requires user approval, ensuring you maintain complete control while benefiting from intelligent automation.
              </p>
            </div>
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Fully Auditable</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">User-Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Four Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
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
                
                <CardContent className="relative">
                  <CardDescription className="text-gray-700 leading-relaxed mb-6 text-base">
                    {feature.description}
                  </CardDescription>
                  
                  <Button 
                    asChild 
                    className={`${feature.buttonColor} text-white shadow-md hover:shadow-lg transition-all duration-300 group/btn`}
                  >
                    <Link href={feature.link} className="flex items-center gap-2">
                      See it in demo
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
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
                <Link href="/">Back to Home</Link>
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
