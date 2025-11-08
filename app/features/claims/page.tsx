"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDashboardUrl } from '@/lib/navigation';
import { 
  FileText,
  Shield,
  Code,
  FileCheck,
  Eye,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { DocumentUpload } from "@/components/claims/document-upload";
import { ClaimForm } from "@/components/claims/claim-form";

const capabilities = [
  {
    title: "Pre-Check Coverage",
    description: "Verify coverage and eligibility before submitting claims to avoid rejections and delays.",
    icon: Shield
  },
  {
    title: "Assemble Codes",
    description: "Automatically gather and organize CPT and ICD-10 codes required for accurate claim submission.",
    icon: Code
  },
  {
    title: "Generate Clean Claims",
    description: "Create properly formatted claims with all required information to ensure fast processing.",
    icon: FileCheck
  },
  {
    title: "Generate Appeals",
    description: "Draft professional appeals for denied claims with evidence and proper documentation.",
    icon: FileText
  },
  {
    title: "Monitor Status",
    description: "Track claim status in real-time and receive notifications about approvals, denials, or requests for information.",
    icon: Eye
  },
  {
    title: "Deadline Tracking",
    description: "Get reminders for appeal deadlines and required follow-ups to never miss important dates.",
    icon: Clock
  }
];

export default function ClaimsPage() {
  const { user } = useUser();
  const dashboardUrl = useDashboardUrl();
  const [userId] = useState("user-123"); // In production, get from auth
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string; type: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "process">("upload");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href={dashboardUrl} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-purple-600" />
                <span className="text-xl font-bold text-gray-900">Claims</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href={dashboardUrl}>Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700">Feature</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Claims Processing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Pre-check coverage, assemble codes (CPT/ICD-10), generate clean claims and appeals, and monitor status. 
            Streamline your insurance claims process with automated error checking and real-time tracking.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b">
          <Button
            variant={activeTab === "upload" ? "default" : "ghost"}
            onClick={() => setActiveTab("upload")}
            className="rounded-b-none"
          >
            Upload Documents
          </Button>
          <Button
            variant={activeTab === "process" ? "default" : "ghost"}
            onClick={() => setActiveTab("process")}
            className="rounded-b-none"
          >
            Process Claim
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "upload" && (
          <DocumentUpload
            userId={userId}
            onUploadComplete={(files) => {
              setUploadedDocs(
                files.map((f) => ({
                  id: f.id,
                  type: f.type,
                  name: f.file.name,
                }))
              );
            }}
          />
        )}

        {activeTab === "process" && (
          <ClaimForm userId={userId} uploadedDocuments={uploadedDocs} />
        )}

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <Card key={index} className="border-2 hover:border-purple-300 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-purple-600" />
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
        <Card className="border-2 border-purple-200 bg-purple-50/50 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Pre-Check Coverage</h3>
                  <p className="text-gray-600">
                    Before submitting, verify that services are covered under your plan and check eligibility requirements 
                    to avoid immediate rejections.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Assemble & Generate</h3>
                  <p className="text-gray-600">
                    Automatically gather CPT and ICD-10 codes, verify accuracy, and generate clean, properly formatted 
                    claims ready for submission.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Monitor & Appeal</h3>
                  <p className="text-gray-600">
                    Track claim status in real-time. If denied, generate professional appeals with evidence and proper 
                    documentation. Never miss appeal deadlines.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                Reduced Rejections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Pre-checking coverage and assembling accurate codes significantly reduces the chance of claim rejections, 
                saving time and frustration.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Faster Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Clean, properly formatted claims with all required information process faster, getting you reimbursed sooner.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                Better Appeals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Professional appeals with evidence and proper documentation increase your chances of successful claim resolution.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                Full Visibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Real-time status tracking and deadline reminders keep you informed and ensure nothing falls through the cracks.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

