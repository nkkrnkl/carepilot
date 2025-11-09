"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, User, Stethoscope, ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(true);

  useEffect(() => {
    if (user && !isLoading) {
      // Check if user has a role set, and handle role saving from signup
      checkUserRole();
    }
  }, [user, isLoading]);

  async function checkUserRole() {
    if (!user?.email) return;
    
    try {
      console.log("Signup page - User authenticated, checking role for:", user.email);
      
      // Check multiple sources for role (in priority order)
      let roleToUse: "patient" | "doctor" | null = null;
      
      // 1. Check sessionStorage and localStorage (for redundancy)
      const storedRoleSession = sessionStorage.getItem("signupRole");
      const storedRoleLocal = localStorage.getItem("signupRole");
      const storedRole = storedRoleSession || storedRoleLocal;
      if (storedRole === "patient" || storedRole === "doctor") {
        roleToUse = storedRole;
        console.log("Signup page - Found role in storage:", roleToUse);
      }
      
      // 2. Check if user already has a role in database
      const roleApiResponse = await fetch("/api/users/role");
      const roleApiData = await roleApiResponse.json();
      
      console.log("Signup page - Role API response:", roleApiData);
      
      if (roleApiData.success && roleApiData.role) {
        // User already has a role - redirect immediately
        console.log("Signup page - User has role in database:", roleApiData.role);
        sessionStorage.removeItem("signupRole");
        localStorage.removeItem("signupRole");
        const redirectUrl = roleApiData.role === "doctor" ? "/doctorportal" : "/patient";
        console.log("Signup page - Redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
        return;
      }
      
      // 3. Check user data endpoint
      const response = await fetch(`/api/users?emailAddress=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      console.log("Signup page - User data response:", data);
      
      if (data.success && data.user?.userRole) {
        // User has a role in user data
        console.log("Signup page - User has role in user data:", data.user.userRole);
        sessionStorage.removeItem("signupRole");
        localStorage.removeItem("signupRole");
        const redirectUrl = data.user.userRole === "doctor" ? "/doctorportal" : "/patient";
        console.log("Signup page - Redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
        return;
      }
      
      // 4. If we have a stored role but no role in database, save it
      if (roleToUse) {
        console.log("Signup page - Saving stored role to database:", roleToUse);
        
        try {
          const roleResponse = await fetch("/api/users/role", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: roleToUse }),
          });

          const roleData = await roleResponse.json();
          console.log("Signup page - Role save response:", roleData);

          if (roleData.success) {
            // Clear stored role
            sessionStorage.removeItem("signupRole");
            localStorage.removeItem("signupRole");
            
            // Wait a moment to ensure database write completes
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Double-check the role was saved
            const verifyResponse = await fetch("/api/users/role");
            const verifyData = await verifyResponse.json();
            console.log("Signup page - Verification response:", verifyData);
            
            if (verifyData.success && verifyData.role === roleToUse) {
              // Redirect to appropriate dashboard using window.location for hard redirect
              const redirectUrl = roleToUse === "doctor" ? "/doctorportal" : "/patient";
              console.log("Signup page - Role verified, redirecting to:", redirectUrl);
              window.location.href = redirectUrl;
              return;
            } else {
              console.error("Signup page - Role verification failed. Expected:", roleToUse, "Got:", verifyData.role);
              throw new Error(`Role verification failed. Expected: ${roleToUse}, Got: ${verifyData.role || "null"}`);
            }
          } else {
            console.error("Signup page - Failed to save role:", roleData.error);
            throw new Error(roleData.error || "Failed to save role");
          }
        } catch (error: any) {
          console.error("Signup page - Error saving role:", error);
          // Show error to user and allow them to try again
          alert(`Error saving role: ${error.message || "Unknown error"}. Please try selecting your role again.`);
          setShowRoleSelection(true);
          return;
        }
      }
      
      // 5. No role found anywhere - show role selection
      console.log("Signup page - No role found, showing role selection");
      setShowRoleSelection(true);
      
    } catch (error) {
      console.error("Signup page - Error checking user role:", error);
      // On error, show role selection
      setShowRoleSelection(true);
    }
  }

  function handleRoleSelect(role: "patient" | "doctor") {
    setSelectedRole(role);
    // Store role in sessionStorage AND localStorage (for redundancy)
    sessionStorage.setItem("signupRole", role);
    localStorage.setItem("signupRole", role);
    
    // Also store with timestamp to help debug
    try {
      sessionStorage.setItem("signupRoleTimestamp", Date.now().toString());
    } catch (e) {
      console.warn("Could not set timestamp:", e);
    }
    
    console.log("Signup: Storing role for signup:", role);
    console.log("Signup: Redirecting to Auth0...");
    
    // Redirect to Auth0 with role parameter
    const authUrl = `/auth/login?screen_hint=signup&role=${role}`;
    console.log("Signup: Auth URL:", authUrl);
    window.location.href = authUrl;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in but no role selection shown yet, show loading
  if (user && showRoleSelection && selectedRole === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // If user is logged in and has role, they'll be redirected
  if (user && !showRoleSelection) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold text-gray-900">CarePilot</h1>
          </Link>
          <p className="text-gray-600 text-lg">Create your account</p>
          <p className="text-gray-500 text-sm mt-2">Choose your account type to get started</p>
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
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Track your health journey</span>
                </li>
              </ul>
              <Button 
                className={`w-full ${selectedRole === "patient" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                variant={selectedRole === "patient" ? "default" : "outline"}
              >
                Continue as Patient
                <ArrowRight className="ml-2 h-4 w-4" />
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
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Access clinical dashboard</span>
                </li>
              </ul>
              <Button 
                className={`w-full ${selectedRole === "doctor" ? "bg-green-600 hover:bg-green-700" : ""}`}
                variant={selectedRole === "doctor" ? "default" : "outline"}
              >
                Continue as Doctor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign In
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
