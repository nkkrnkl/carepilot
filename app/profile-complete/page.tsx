"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function ProfileCompletePage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    FirstName: "",
    LastName: "",
    DateOfBirth: "",
    StreetAddress: "",
    PatientCity: "",
    PatientState: "",
    InsurancePlanType: "PPO",
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user?.email) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/users/complete-profile?email=${encodeURIComponent(user.email)}`);
        const data = await response.json();

        if (data.success && data.user) {
          // Pre-fill form with existing data
          setProfileData({
            FirstName: data.user.FirstName || "",
            LastName: data.user.LastName || "",
            DateOfBirth: data.user.DateOfBirth || "",
            StreetAddress: data.user.StreetAddress || "",
            PatientCity: data.user.PatientCity || "",
            PatientState: data.user.PatientState || "",
            InsurancePlanType: data.user.InsurancePlanType || "PPO",
          });

          // If profile is already complete, redirect to dashboard
          if (data.isComplete) {
            const dashboardUrl = data.user.userRole === "doctor" ? "/doctorportal" : "/patient";
            router.push(dashboardUrl);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading && user) {
      loadProfile();
    }
  }, [user, userLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user?.email) {
      toast.error("You must be logged in to complete your profile");
      return;
    }

    // Validate DateOfBirth before submitting
    if (!profileData.DateOfBirth || profileData.DateOfBirth.trim() === "") {
      toast.error("Please select your date of birth");
      return;
    }

    // Validate all required fields
    if (!profileData.FirstName?.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!profileData.LastName?.trim()) {
      toast.error("Last name is required");
      return;
    }
    if (!profileData.StreetAddress?.trim()) {
      toast.error("Street address is required");
      return;
    }
    if (!profileData.PatientCity?.trim()) {
      toast.error("City is required");
      return;
    }
    if (!profileData.PatientState?.trim()) {
      toast.error("State is required");
      return;
    }
    if (!profileData.InsurancePlanType) {
      toast.error("Insurance plan type is required");
      return;
    }

    setSaving(true);
    try {
      // Prepare the data to send - ensure DateOfBirth is in YYYY-MM-DD format
      const submitData = {
        email: user.email,
        FirstName: profileData.FirstName.trim(),
        LastName: profileData.LastName.trim(),
        DateOfBirth: profileData.DateOfBirth.trim(), // Date input should already be YYYY-MM-DD
        StreetAddress: profileData.StreetAddress.trim(),
        PatientCity: profileData.PatientCity.trim(),
        PatientState: profileData.PatientState.trim().toUpperCase(), // Convert state to uppercase
        InsurancePlanType: profileData.InsurancePlanType,
      };

      console.log("Submitting profile data:", submitData);

      const response = await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save profile");
      }

      toast.success("Profile completed successfully!");
      
      // Redirect to appropriate dashboard
      const userResponse = await fetch(`/api/users?emailAddress=${encodeURIComponent(user.email)}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success && userData.user?.userRole) {
          router.push(userData.user.userRole === "doctor" ? "/doctorportal" : "/patient");
        } else {
          router.push("/patient");
        }
      } else {
        router.push("/patient");
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">You must be logged in to complete your profile.</p>
              <Button onClick={() => router.push("/signin")}>Sign In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <Toaster />
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Please fill in your profile information to continue. All fields are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="FirstName">First Name *</Label>
                    <Input
                      id="FirstName"
                      value={profileData.FirstName}
                      onChange={(e) => setProfileData({ ...profileData, FirstName: e.target.value })}
                      required
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="LastName">Last Name *</Label>
                    <Input
                      id="LastName"
                      value={profileData.LastName}
                      onChange={(e) => setProfileData({ ...profileData, LastName: e.target.value })}
                      required
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="DateOfBirth">Date of Birth *</Label>
                  <Input
                    id="DateOfBirth"
                    type="date"
                    value={profileData.DateOfBirth}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      console.log("DateOfBirth changed:", dateValue);
                      setProfileData({ ...profileData, DateOfBirth: dateValue });
                    }}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                  />
                  {profileData.DateOfBirth && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {new Date(profileData.DateOfBirth).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address</h3>
                
                <div>
                  <Label htmlFor="StreetAddress">Street Address *</Label>
                  <Input
                    id="StreetAddress"
                    value={profileData.StreetAddress}
                    onChange={(e) => setProfileData({ ...profileData, StreetAddress: e.target.value })}
                    required
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="PatientCity">City *</Label>
                    <Input
                      id="PatientCity"
                      value={profileData.PatientCity}
                      onChange={(e) => setProfileData({ ...profileData, PatientCity: e.target.value })}
                      required
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label htmlFor="PatientState">State *</Label>
                    <Input
                      id="PatientState"
                      value={profileData.PatientState}
                      onChange={(e) => setProfileData({ ...profileData, PatientState: e.target.value })}
                      required
                      placeholder="NY"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Insurance Information</h3>
                
                <div>
                  <Label htmlFor="InsurancePlanType">Insurance Plan Type *</Label>
                  <select
                    id="InsurancePlanType"
                    value={profileData.InsurancePlanType}
                    onChange={(e) => setProfileData({ ...profileData, InsurancePlanType: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HMO">HMO</option>
                    <option value="PPO">PPO</option>
                    <option value="EPO">EPO</option>
                    <option value="POS">POS</option>
                    <option value="HDHP">HDHP</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Complete Profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

