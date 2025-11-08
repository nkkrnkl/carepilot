"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDashboardUrl } from '@/lib/navigation';
import { 
  Receipt,
  FileSearch,
  DollarSign,
  Mail,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  FileText,
  CheckCircle2
} from "lucide-react";

const capabilities = [
  {
    title: "Read Bills & EOBs",
    description: "Automatically parse medical bills and Explanation of Benefits (EOBs) to extract all charges and details.",
    icon: FileText
  },
  {
    title: "Detect Discrepancies",
    description: "Identify duplicate charges, code mismatches, and non-contracted rates that may indicate billing errors.",
    icon: AlertCircle
  },
  {
    title: "Estimate Right Price",
    description: "Compare charges against industry standards and fair market rates to determine the appropriate price.",
    icon: DollarSign
  },
  {
    title: "Draft Negotiation Emails",
    description: "Generate professional, evidence-based negotiation emails ready to send to providers or insurance companies.",
    icon: Mail
  },
  {
    title: "Create Negotiation Scripts",
    description: "Get talking points and scripts for phone negotiations with clear arguments and evidence to support your case.",
    icon: FileSearch
  },
  {
    title: "Track Outcomes",
    description: "Monitor negotiation progress, track responses, and document savings achieved through successful negotiations.",
    icon: TrendingUp
  }
];

export default function BillNegotiationPage() {
  const { user } = useUser();
  const dashboardUrl = useDashboardUrl();
  
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
                <Receipt className="h-6 w-6 text-orange-600" />
                <span className="text-xl font-bold text-gray-900">Bill Negotiation</span>
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
          <Badge className="mb-4 bg-orange-100 text-orange-700">Feature</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Bill Negotiation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Read bills and EOBs, detect discrepancies like duplicate charges and code mismatches, estimate the right price, 
            draft negotiation emails and scripts, and track outcomes. Save money on healthcare costs with data-driven 
            negotiation support.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <Card key={index} className="border-2 hover:border-orange-300 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-orange-600" />
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
        <Card className="border-2 border-orange-200 bg-orange-50/50 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Upload Bills & EOBs</h3>
                  <p className="text-gray-600">
                    Upload your medical bills and Explanation of Benefits. CarePilot automatically extracts all charges, 
                    codes, and payment information.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Detect Issues & Estimate Price</h3>
                  <p className="text-gray-600">
                    Our AI identifies discrepancies like duplicate charges, code mismatches, and non-contracted rates. 
                    Compare against industry standards to determine the fair price.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Draft & Send Negotiations</h3>
                  <p className="text-gray-600">
                    Get professional negotiation emails and phone scripts with evidence-based arguments. Track outcomes 
                    and document savings from successful negotiations.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Discrepancies */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Common Discrepancies We Detect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Duplicate Charges</h4>
                  <p className="text-gray-600 text-sm">Same service or item billed multiple times</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Code Mismatches</h4>
                  <p className="text-gray-600 text-sm">Billing codes that don't match services rendered</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Non-Contracted Rates</h4>
                  <p className="text-gray-600 text-sm">Charges above your insurance's negotiated rates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Balance Billing</h4>
                  <p className="text-gray-600 text-sm">Unexpected charges beyond what insurance covers</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

