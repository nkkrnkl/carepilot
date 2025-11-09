"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDashboardUrl } from '@/lib/navigation';
import { Toaster, toast } from "sonner";
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

export default function ProfilePage() {
  const dashboardUrl = useDashboardUrl();
  const { user: auth0User, isLoading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
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

  // Load user data from Azure SQL Server when component mounts
  useEffect(() => {
    async function loadUserData() {
      if (!auth0User?.email || userLoading) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Loading profile for authenticated user:", auth0User.email);
        
        const response = await fetch(`/api/users?emailAddress=${encodeURIComponent(auth0User.email)}`);
        const data = await response.json();

        console.log("Profile API response:", { 
          success: data.success, 
          hasUser: !!data.user,
          userEmail: data.user?.emailAddress,
          requestedEmail: auth0User.email 
        });

        if (data.success && data.user) {
          const user = data.user;
          console.log("Loading user data from database:", {
            email: user.emailAddress,
            firstName: user.FirstName,
            lastName: user.LastName,
            dateOfBirth: user.DateOfBirth
          });
          
          // Map database fields to form fields
          setFormData({
            firstName: user.FirstName || "",
            lastName: user.LastName || "",
            dateOfBirth: user.DateOfBirth || "",
            email: user.emailAddress || auth0User.email || "",
            phone: user.InsuranceCompanyPhoneNumber || "", // Using insurance phone as general phone for now
            address: user.StreetAddress || "",
            city: user.PatientCity || "",
            state: user.PatientState || "",
            zipCode: "", // ZipCode not in user_table schema
            preferredLanguage: "English", // Not in schema
            insuranceCompany: "", // Not directly in schema (would need insurer_table join)
            insuranceAccountNumber: "", // Not in schema
            insuranceGroupNumber: user.InsuranceGroupNumber || "",
            insurancePlanType: user.InsurancePlanType || "",
            insuranceCompanyAddress: user.InsuranceCompanyStreetAddress || "",
            insuranceCompanyCity: user.InsuranceCompanyCity || "",
            insuranceCompanyState: user.InsuranceCompanyState || "",
            insuranceCompanyZipCode: "", // Not in schema
            insuranceCompanyPhone: user.InsuranceCompanyPhoneNumber || "",
          });
        } else if (response.status === 404) {
          // User doesn't exist in database yet - show empty form with email
          console.log("User not found in database, showing empty form");
          setFormData(prev => ({
            ...prev,
            email: auth0User.email || "",
          }));
          toast.info("Profile not found. Please complete your profile information.");
        } else {
          console.error("Failed to load user data:", data.error);
          toast.error(data.error || "Failed to load profile data");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [auth0User, userLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth0User?.email) {
      toast.error("You must be logged in to save your profile");
      return;
    }

    setSaving(true);
    try {
      // Map form fields back to database fields
      const updateData = {
        emailAddress: auth0User.email,
        FirstName: formData.firstName.trim(),
        LastName: formData.lastName.trim(),
        DateOfBirth: formData.dateOfBirth.trim(),
        StreetAddress: formData.address.trim(),
        PatientCity: formData.city.trim(),
        PatientState: formData.state.trim().toUpperCase(),
        InsuranceGroupNumber: formData.insuranceGroupNumber.trim() || null,
        InsurancePlanType: formData.insurancePlanType.trim(),
        InsuranceCompanyStreetAddress: formData.insuranceCompanyAddress.trim() || null,
        InsuranceCompanyCity: formData.insuranceCompanyCity.trim() || null,
        InsuranceCompanyState: formData.insuranceCompanyState.trim() || null,
        InsuranceCompanyPhoneNumber: formData.insuranceCompanyPhone.trim() || null,
      };

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save profile");
      }

      setIsSaved(true);
      toast.success("Profile saved successfully!");
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-100/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder={auth0User?.email || "your.email@example.com"}
                  value={formData.email || auth0User?.email || ""}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email is your primary key and cannot be changed. 
                  {auth0User?.email && (
                    <span className="block mt-1 font-semibold">Authenticated as: {auth0User.email}</span>
                  )}
                </p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Zip Code
                </label>
                <Input
                  placeholder="02139"
                  value={formData.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Optional - not stored in database</p>
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
                  Insurance Company
                </label>
                <Input
                  placeholder="Blue Cross Blue Shield"
                  value={formData.insuranceCompany}
                  onChange={(e) => handleChange("insuranceCompany", e.target.value)}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Managed through insurer_table (read-only)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Account Number
                  </label>
                  <Input
                    placeholder="123456789"
                    value={formData.insuranceAccountNumber}
                    onChange={(e) => handleChange("insuranceAccountNumber", e.target.value)}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Not stored in database</p>
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
                  Plan Type *
                </label>
                <select
                  value={formData.insurancePlanType}
                  onChange={(e) => handleChange("insurancePlanType", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  required
                >
                  <option value="">Select plan type</option>
                  <option value="HMO">HMO</option>
                  <option value="PPO">PPO</option>
                  <option value="EPO">EPO</option>
                  <option value="POS">POS</option>
                  <option value="HDHP">HDHP</option>
                  <option value="Other">Other</option>
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
              disabled={saving}
            >
              {saving ? (
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
      </div>
    </div>
  );
}

