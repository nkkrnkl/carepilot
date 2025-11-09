"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDashboardUrl } from '@/lib/navigation';
import {
  ArrowLeft,
  User,
  Calendar,
  CreditCard,
  Building,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Shield,
  FileText,
  Loader2
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function ProfilePage() {
  const { user } = useUser();
  const dashboardUrl = useDashboardUrl();
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    preferredLanguage: "English",
    
    // Insurance Information
    insuranceCompany: "",
    insuranceAccountNumber: "",
    insuranceGroupNumber: "",
    insurancePlanType: "",
    insuranceCompanyAddress: "",
    insuranceCompanyCity: "",
    insuranceCompanyState: "",
    insuranceCompanyZipCode: "",
    insuranceCompanyPhone: "",
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      if (!user?.email) {
        setIsLoadingData(false);
        return;
      }

      try {
        setIsLoadingData(true);
        const response = await fetch(`/api/users?emailAddress=${encodeURIComponent(user.email)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Map database fields to form fields
            const userData = data.user;
            
            // Format DateOfBirth for HTML date input (YYYY-MM-DD format)
            let dateOfBirthFormatted = "";
            if (userData.DateOfBirth) {
              try {
                const dateObj = userData.DateOfBirth instanceof Date 
                  ? userData.DateOfBirth 
                  : new Date(userData.DateOfBirth);
                if (!isNaN(dateObj.getTime())) {
                  // Format as YYYY-MM-DD for HTML date input
                  dateOfBirthFormatted = dateObj.toISOString().split('T')[0];
                }
              } catch (e) {
                console.error("Error formatting DateOfBirth:", e);
              }
            }
            
            setFormData({
              firstName: userData.FirstName || "",
              lastName: userData.LastName || "",
              dateOfBirth: dateOfBirthFormatted,
              email: userData.emailAddress || user.email || "",
              phone: userData.PhoneNumber || "",
              address: userData.StreetAddress || "",
              city: userData.PatientCity || "",
              state: userData.PatientState || "",
              zipCode: userData.zipCode || "",
              preferredLanguage: userData.preferredLanguage || "English",
              insuranceCompany: userData.InsuranceCompanyName || "",
              insuranceAccountNumber: userData.InsuranceAccountNumber || "",
              insuranceGroupNumber: userData.InsuranceGroupNumber || "",
              insurancePlanType: (userData.InsurancePlanType || "").toLowerCase(),
              insuranceCompanyAddress: userData.InsuranceCompanyStreetAddress || "",
              insuranceCompanyCity: userData.InsuranceCompanyCity || "",
              insuranceCompanyState: userData.InsuranceCompanyState || "",
              insuranceCompanyZipCode: userData.InsuranceCompanyZipCode || "",
              insuranceCompanyPhone: userData.InsuranceCompanyPhoneNumber || "",
            });
          } else {
            // User doesn't exist yet, set email from Auth0
            console.log("User profile not found - user can fill out their profile");
            setFormData(prev => ({ ...prev, email: user.email || "" }));
          }
        } else if (response.status === 404) {
          // User doesn't exist in database yet - this is normal for new users
          console.log("User profile not found in database - this is normal for new users");
          setFormData(prev => ({ ...prev, email: user.email || "" }));
        } else {
          // Other error (500, etc.)
          console.error("Failed to load user data:", response.status, response.statusText);
          setFormData(prev => ({ ...prev, email: user.email || "" }));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Don't show error to user - just allow them to fill out the form
        setFormData(prev => ({ ...prev, email: user.email || "" }));
      } finally {
        setIsLoadingData(false);
      }
    }

    loadUserData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!user?.email) {
      setError("You must be logged in to save your profile");
      setIsLoading(false);
      return;
    }

    try {
      // Map form fields to database field names
      // Normalize InsurancePlanType: convert lowercase to uppercase, or default to "Other"
      let insurancePlanType = formData.insurancePlanType;
      if (!insurancePlanType || insurancePlanType === "") {
        insurancePlanType = "Other";
      } else {
        // Convert to uppercase (hmo -> HMO, ppo -> PPO, etc.)
        insurancePlanType = insurancePlanType.toUpperCase();
      }

      const userData = {
        emailAddress: user.email,
        FirstName: formData.firstName,
        LastName: formData.lastName,
        DateOfBirth: formData.dateOfBirth,
        PhoneNumber: formData.phone || undefined,
        StreetAddress: formData.address,
        PatientCity: formData.city,
        PatientState: formData.state,
        InsuranceCompanyName: formData.insuranceCompany || undefined,
        InsuranceAccountNumber: formData.insuranceAccountNumber || undefined,
        InsuranceGroupNumber: formData.insuranceGroupNumber || undefined,
        InsurancePlanType: insurancePlanType, // Always set (defaults to "Other")
        InsuranceCompanyStreetAddress: formData.insuranceCompanyAddress || undefined,
        InsuranceCompanyCity: formData.insuranceCompanyCity || undefined,
        InsuranceCompanyState: formData.insuranceCompanyState || undefined,
        InsuranceCompanyPhoneNumber: formData.insuranceCompanyPhone || undefined,
      };

      // First, check if user exists
      console.log("Checking if user exists:", user.email);
      const checkResponse = await fetch(`/api/users?emailAddress=${encodeURIComponent(user.email)}`);
      const checkData = await checkResponse.json();
      console.log("User check response:", checkData);
      
      let response;
      if (checkData.success && checkData.user) {
        // User exists, update them
        console.log("User exists, updating:", userData);
        response = await fetch("/api/users", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      } else {
        // User doesn't exist, create them
        // POST requires all required fields
        if (!userData.FirstName || !userData.LastName || !userData.DateOfBirth || 
            !userData.StreetAddress || !userData.PatientCity || !userData.PatientState) {
          const missingFields = [];
          if (!userData.FirstName) missingFields.push("First Name");
          if (!userData.LastName) missingFields.push("Last Name");
          if (!userData.DateOfBirth) missingFields.push("Date of Birth");
          if (!userData.StreetAddress) missingFields.push("Address");
          if (!userData.PatientCity) missingFields.push("City");
          if (!userData.PatientState) missingFields.push("State");
          
          const errorMsg = `Please fill in all required fields: ${missingFields.join(", ")}`;
          setError(errorMsg);
          toast.error(errorMsg);
          setIsLoading(false);
          return;
        }
        
        console.log("User doesn't exist, creating:", userData);
        response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      }

      console.log("Save response status:", response.status);
      const data = await response.json();
      console.log("Save response data:", data);

      if (response.ok && data.success) {
        setIsSaved(true);
        toast.success("Profile saved successfully!");
        setTimeout(() => setIsSaved(false), 3000);
        // Reload user data to show updated information
        window.location.reload();
      } else {
        const errorMsg = data.error || "Failed to save profile";
        console.error("Save error:", errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save profile";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-100/20">
      <Toaster />
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
                <User className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Profile</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href={dashboardUrl}>Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Success Banner */}
      {isSaved && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Profile saved successfully!</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading profile data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <Card className="mb-6 border-2 overflow-hidden py-0">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-2xl mb-1">Personal Information</CardTitle>
                  <CardDescription className="m-0">Your basic personal details</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="pt-6 pb-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    First Name *
                  </label>
                  <Input
                    required
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Last Name *
                  </label>
                  <Input
                    required
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth *
                  </label>
                  <Input
                    required
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Preferred Language
                  </label>
                  <select
                    value={formData.preferredLanguage}
                    onChange={(e) => handleChange("preferredLanguage", e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Chinese">Chinese</option>
                    <option value="French">French</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address *
                </label>
                <Input
                  required
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    City *
                  </label>
                  <Input
                    required
                    placeholder="Cambridge"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    State *
                  </label>
                  <Input
                    required
                    placeholder="MA"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Zip Code *
                  </label>
                  <Input
                    required
                    placeholder="02139"
                    value={formData.zipCode}
                    onChange={(e) => handleChange("zipCode", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information Section */}
          <Card className="mb-6 border-2 border-blue-200 overflow-hidden py-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-2xl mb-1">Insurance Information</CardTitle>
                  <CardDescription className="m-0">Your health insurance details</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="pt-6 pb-8 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Insurance Company *
                </label>
                <Input
                  required
                  placeholder="Blue Cross Blue Shield"
                  value={formData.insuranceCompany}
                  onChange={(e) => handleChange("insuranceCompany", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Account Number *
                  </label>
                  <Input
                    required
                    placeholder="123456789"
                    value={formData.insuranceAccountNumber}
                    onChange={(e) => handleChange("insuranceAccountNumber", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Group Number
                  </label>
                  <Input
                    placeholder="ABC123"
                    value={formData.insuranceGroupNumber}
                    onChange={(e) => handleChange("insuranceGroupNumber", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Plan Type
                </label>
                <select
                  value={formData.insurancePlanType}
                  onChange={(e) => handleChange("insurancePlanType", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Select plan type</option>
                  <option value="hmo">HMO</option>
                  <option value="ppo">PPO</option>
                  <option value="epo">EPO</option>
                  <option value="pos">POS</option>
                  <option value="hdhp">HDHP</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Insurance Company Address */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Company Address</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Street Address
                  </label>
                  <Input
                    placeholder="123 Insurance Ave"
                    value={formData.insuranceCompanyAddress}
                    onChange={(e) => handleChange("insuranceCompanyAddress", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      City
                    </label>
                    <Input
                      placeholder="Boston"
                      value={formData.insuranceCompanyCity}
                      onChange={(e) => handleChange("insuranceCompanyCity", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      State
                    </label>
                    <Input
                      placeholder="MA"
                      value={formData.insuranceCompanyState}
                      onChange={(e) => handleChange("insuranceCompanyState", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Zip Code
                    </label>
                    <Input
                      placeholder="02101"
                      value={formData.insuranceCompanyZipCode}
                      onChange={(e) => handleChange("insuranceCompanyZipCode", e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Insurance Company Phone
                  </label>
                  <Input
                    type="tel"
                    placeholder="+1 (800) 123-4567"
                    value={formData.insuranceCompanyPhone}
                    onChange={(e) => handleChange("insuranceCompanyPhone", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-between bg-white rounded-xl border-2 border-blue-200 p-6 shadow-lg">
            <div className="flex items-center gap-2 text-gray-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">All fields marked with * are required</span>
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              disabled={isLoading || isLoadingData}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

