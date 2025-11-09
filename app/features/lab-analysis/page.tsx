"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentUploadSimple } from "@/components/documents/document-upload-simple";
import { 
  Beaker,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  ArrowLeft,
  BarChart3,
} from "lucide-react";

const capabilities = [
  {
    title: "Parse Common Labs",
    description: "Automatically extract and organize data from lab results, regardless of format or provider.",
    icon: Beaker
  },
  {
    title: "Track Trends & Deltas",
    description: "Monitor changes over time with visual trend analysis and delta calculations between tests.",
    icon: TrendingUp
  },
  {
    title: "Flag Out-of-Range Values",
    description: "Instantly identify values that fall outside normal ranges with clear visual indicators.",
    icon: AlertTriangle
  },
  {
    title: "Plain-English Context",
    description: "Translate medical terminology into understandable language with detailed explanations.",
    icon: MessageSquare
  },
  {
    title: "Suggested Questions",
    description: "Get informed questions to discuss with your clinician based on your lab results.",
    icon: MessageSquare
  },
  {
    title: "Historical Comparisons",
    description: "Compare current results with previous tests to identify patterns and improvements.",
    icon: BarChart3
  }
];

export default function LabAnalysisPage() {
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleUploadComplete = (file: any) => {
    console.log("Lab report upload complete:", file);
    setUploadComplete(true);
    // You can add additional logic here, like refreshing the lab reports list
  };

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
                <Beaker className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Lab Analysis</span>
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
          <Badge className="mb-4 bg-blue-100 text-blue-700">Feature</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Lab Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Parse common labs, track trends and deltas, flag out-of-range values with plain-English context 
            and suggested questions for your clinician. Get actionable insights from your lab results with 
            AI-powered analysis that helps you understand your health metrics.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <DocumentUploadSimple
            userId="default-user" // TODO: Get from authentication context
            defaultDocType="lab_report"
            showDocTypeSelector={false}
            title="Upload Lab Report"
            description="Upload PDF lab reports to analyze your lab results. Files will be processed and stored for analysis."
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <Card key={index} className="border-2 hover:border-blue-300 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-blue-600" />
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
        <Card className="border-2 border-blue-200 bg-blue-50/50 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Upload Your Lab Results</h3>
                  <p className="text-gray-600">
                    Upload lab results in any format. CarePilot automatically extracts and organizes all relevant data.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Analysis & Context</h3>
                  <p className="text-gray-600">
                    Our AI analyzes your results, identifies trends, flags anomalies, and provides plain-English explanations.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Get Actionable Insights</h3>
                  <p className="text-gray-600">
                    Receive suggested questions for your clinician and track your health metrics over time with visual trends.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="border-2 border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg font-semibold text-gray-900">Important Notice</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              CarePilot's lab analysis is <strong>informational only and not medical advice</strong>. All insights, 
              explanations, and suggested questions are provided to help you better understand your lab results and 
              facilitate discussions with your healthcare provider. Always consult with a qualified clinician for 
              medical decisions and interpretations.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

