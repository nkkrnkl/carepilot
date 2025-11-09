"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Stethoscope, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if role is stored in sessionStorage from signup
    const signupRole = sessionStorage.getItem("signupRole");
    if (signupRole && (signupRole === "patient" || signupRole === "doctor")) {
      setSelectedRole(signupRole as "patient" | "doctor");
      // Automatically save if role was selected during signup
      handleSaveRole(signupRole as "patient" | "doctor");
    }
  }, []);

  async function handleSaveRole(role: "patient" | "doctor") {
    if (!user?.email) {
      setError("You must be logged in to set your role");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email, role }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save role");
      }

      // Clear signup role from sessionStorage
      sessionStorage.removeItem("signupRole");

      // Redirect to appropriate dashboard
      router.push(role === "doctor" ? "/doctorportal" : "/patient");
    } catch (err: any) {
      console.error("Error saving role:", err);
      setError(err.message || "Failed to save role. Please try again.");
      setSaving(false);
    }
  }

  function handleRoleSelect(role: "patient" | "doctor") {
    setSelectedRole(role);
    handleSaveRole(role);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">You must be logged in to select your role.</p>
          <Button asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold text-gray-900">CarePilot</h1>
          </Link>
          <p className="text-gray-600 text-lg">Complete your account setup</p>
          <p className="text-gray-500 text-sm mt-2">Please select your account type to continue</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Card */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              selectedRole === "patient" 
                ? "border-blue-600 bg-blue-50" 
                : "border-gray-200 hover:border-blue-300"
            } ${saving && selectedRole !== "patient" ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !saving && handleRoleSelect("patient")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Patient</CardTitle>
              <CardDescription className="text-base mt-2">
                Access your health records, appointments, and care management tools
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>View lab results and health metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Schedule appointments with providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Manage bills and insurance claims</span>
                </li>
              </ul>
              <Button 
                className="w-full"
                variant={selectedRole === "patient" ? "default" : "outline"}
                disabled={saving}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelect("patient");
                }}
              >
                {saving && selectedRole === "patient" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Continue as Patient
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Card */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              selectedRole === "doctor" 
                ? "border-green-600 bg-green-50" 
                : "border-gray-200 hover:border-green-300"
            } ${saving && selectedRole !== "doctor" ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !saving && handleRoleSelect("doctor")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Doctor</CardTitle>
              <CardDescription className="text-base mt-2">
                Access your practice dashboard, patient records, and clinical tools
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Manage patient visits and records</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Review lab results and diagnostics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Write prescriptions and generate reports</span>
                </li>
              </ul>
              <Button 
                className="w-full"
                variant={selectedRole === "doctor" ? "default" : "outline"}
                disabled={saving}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelect("doctor");
                }}
              >
                {saving && selectedRole === "doctor" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Continue as Doctor
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

