"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, User, Stethoscope, ArrowRight, Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | null>(null);
  const [checkingRole, setCheckingRole] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  // Check user role after authentication and automatically redirect
  useEffect(() => {
    async function checkAndRedirect() {
      if (user && !isLoading && user.email) {
        setCheckingRole(true);
        try {
          // First, check if role was stored during signup (before Auth0 callback)
          const storedRole = sessionStorage.getItem("signupRole");
          
          // Check if user has a role set in database
          const response = await fetch(`/api/users/role?email=${encodeURIComponent(user.email)}`);
          const data = await response.json();
          
          if (data.success && data.role) {
            // User has a role in database, automatically redirect to appropriate dashboard
            sessionStorage.removeItem("signupRole"); // Clean up
            router.push(data.role === "doctor" ? "/doctorportal" : "/patient");
            return;
          }
          
          // Check if user exists in database with role
          const userResponse = await fetch(`/api/users?emailAddress=${encodeURIComponent(user.email)}`);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            if (userData.success && userData.user?.userRole) {
              // User has a role in database, automatically redirect
              sessionStorage.removeItem("signupRole"); // Clean up
              router.push(userData.user.userRole === "doctor" ? "/doctorportal" : "/patient");
              return;
            }
          }
          // If 404 or no role, continue to role selection
          
          // No role in database - check if role was stored during signup
          if (storedRole && (storedRole === "patient" || storedRole === "doctor")) {
            // Role was stored, save it to database and redirect
            await saveRoleAndRedirect(storedRole as "patient" | "doctor");
            return;
          }
          
          // No role found - show role selection
          setShowRoleSelection(true);
          setCheckingRole(false);
        } catch (error) {
          console.error("Error checking user role:", error);
          // On error, show role selection
          setShowRoleSelection(true);
          setCheckingRole(false);
        }
      }
    }
    
    checkAndRedirect();
  }, [user, isLoading, router]);

  async function saveRoleAndRedirect(role: "patient" | "doctor") {
    if (!user?.email) return;

    setCheckingRole(true);
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
      setCheckingRole(false);
      setShowRoleSelection(true);
      alert(err.message || "Failed to save role. Please try again.");
    }
  }

  async function handleRoleSelect(role: "patient" | "doctor") {
    if (!user?.email) {
      // User is not logged in, store role and redirect to Auth0
      sessionStorage.setItem("signupRole", role);
      window.location.href = `/auth/login?role=${role}`;
      return;
    }

    // User is logged in, save role and redirect
    setSelectedRole(role);
    await saveRoleAndRedirect(role);
  }

  // Show loading state while checking authentication or role
  if (isLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in and no role selection needed, they'll be redirected (handled in useEffect)
  // Show role selection if user is logged in but has no role
  if (user && showRoleSelection) {
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
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Patient Card */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                selectedRole === "patient" 
                  ? "border-blue-600 bg-blue-50" 
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => handleRoleSelect("patient")}
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
                  disabled={checkingRole}
                >
                  {checkingRole && selectedRole === "patient" ? (
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
              }`}
              onClick={() => handleRoleSelect("doctor")}
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
                  disabled={checkingRole}
                >
                  {checkingRole && selectedRole === "doctor" ? (
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

  // User is not logged in - show sign in options with role selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold text-gray-900">CarePilot</h1>
          </Link>
          <p className="text-gray-600 text-lg">Sign in to access your dashboard</p>
          <p className="text-gray-500 text-sm mt-2">Choose your account type to get started</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Card */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-lg border-2 border-gray-200 hover:border-blue-300"
            onClick={() => handleRoleSelect("patient")}
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
              <Button className="w-full" variant="outline">
                Sign In as Patient
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Card */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-lg border-2 border-gray-200 hover:border-green-300"
            onClick={() => handleRoleSelect("doctor")}
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
              <Button className="w-full" variant="outline">
                Sign In as Doctor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign Up
            </Link>
          </p>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 block mt-2">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
