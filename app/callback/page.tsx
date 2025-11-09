"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';
import { Loader2 } from "lucide-react";

/**
 * Callback page to handle role assignment after Auth0 authentication
 * This page ensures the role is saved to the database after signup
 */
export default function CallbackPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [status, setStatus] = useState<string>("Checking authentication...");

  useEffect(() => {
    async function handleCallback() {
      if (isLoading) {
        return;
      }

      if (!user?.email) {
        // Not authenticated, redirect to signin
        router.push("/signin");
        return;
      }

      try {
        // Check if role is stored in sessionStorage (from signup)
        const storedRole = sessionStorage.getItem("signupRole");
        
        if (storedRole && (storedRole === "patient" || storedRole === "doctor")) {
          setStatus("Saving your role...");
          
          // Save role to database
          const response = await fetch("/api/users/role", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: storedRole }),
          });

          const data = await response.json();

          if (data.success) {
            setStatus("Redirecting to your dashboard...");
            // Clear stored role
            sessionStorage.removeItem("signupRole");
            // Redirect to appropriate dashboard
            router.push(storedRole === "doctor" ? "/doctorportal" : "/patient");
          } else {
            throw new Error(data.error || "Failed to save role");
          }
        } else {
          // No role stored, check if user already has a role
          setStatus("Checking your account...");
          
          const roleResponse = await fetch("/api/users/role");
          const roleData = await roleResponse.json();
          
          if (roleData.success && roleData.role) {
            // User has a role, redirect to dashboard
            router.push(roleData.role === "doctor" ? "/doctorportal" : "/patient");
          } else {
            // No role found, redirect to signin to select role
            router.push("/signin");
          }
        }
      } catch (error: any) {
        console.error("Error in callback:", error);
        setStatus("Error: " + (error.message || "Something went wrong"));
        // Redirect to signin after a delay
        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      }
    }

    handleCallback();
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}

