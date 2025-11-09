"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDashboardUrl } from '@/lib/navigation';
import { Toaster, toast } from "sonner";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Mail,
  Phone,
  MapPin,
  Globe,
  Moon,
  Sun,
  Palette,
  Lock,
  CreditCard,
  HelpCircle,
  Save,
  Trash2,
  LogOut,
  Settings as SettingsIcon,
  Calendar,
  Building,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function SettingsPage() {
  const dashboardUrl = useDashboardUrl();
  const { user: auth0User, isLoading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile data from database
  const [profileData, setProfileData] = useState({
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

  // Benefits data
  const [benefits, setBenefits] = useState<any[]>([]);
  const [benefitsLoading, setBenefitsLoading] = useState(false);

  // Settings data (for other tabs)
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      appointmentReminders: true,
      labResults: true,
      billUpdates: true,
      claimsStatus: true,
      marketing: false
    },
    preferences: {
      theme: "light",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h"
    },
    privacy: {
      shareData: false,
      analytics: true,
      twoFactorAuth: false
    }
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
          setProfileData({
            firstName: user.FirstName || "",
            lastName: user.LastName || "",
            dateOfBirth: user.DateOfBirth || "",
            email: user.emailAddress || auth0User.email || "",
            phone: user.InsuranceCompanyPhoneNumber || "",
            address: user.StreetAddress || "",
            city: user.PatientCity || "",
            state: user.PatientState || "",
            zipCode: "",
            preferredLanguage: "English",
            insuranceCompany: "",
            insuranceAccountNumber: "",
            insuranceGroupNumber: user.InsuranceGroupNumber || "",
            insurancePlanType: user.InsurancePlanType || "",
            insuranceCompanyAddress: user.InsuranceCompanyStreetAddress || "",
            insuranceCompanyCity: user.InsuranceCompanyCity || "",
            insuranceCompanyState: user.InsuranceCompanyState || "",
            insuranceCompanyZipCode: "",
            insuranceCompanyPhone: user.InsuranceCompanyPhoneNumber || "",
          });
        } else if (response.status === 404) {
          // User doesn't exist in database yet - show empty form with email
          console.log("User not found in database, showing empty form");
          setProfileData(prev => ({
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

  // Load benefits data when user is loaded
  useEffect(() => {
    async function loadBenefits() {
      if (!auth0User?.email || userLoading) {
        return;
      }

      try {
        setBenefitsLoading(true);
        const response = await fetch(`/api/benefits?userId=${encodeURIComponent(auth0User.email)}`);
        const data = await response.json();

        if (data.success && data.benefits) {
          // Parse JSON strings back to objects
          const parsedBenefits = data.benefits.map((benefit: any) => ({
            ...benefit,
            deductibles: benefit.deductibles ? JSON.parse(benefit.deductibles) : [],
            copays: benefit.copays ? JSON.parse(benefit.copays) : [],
            coinsurance: benefit.coinsurance ? JSON.parse(benefit.coinsurance) : [],
            coverage_limits: benefit.coverage_limits ? JSON.parse(benefit.coverage_limits) : [],
            services: benefit.services ? JSON.parse(benefit.services) : [],
            preauth_required_services: benefit.preauth_required_services ? JSON.parse(benefit.preauth_required_services) : [],
            exclusions: benefit.exclusions ? JSON.parse(benefit.exclusions) : [],
            special_programs: benefit.special_programs ? JSON.parse(benefit.special_programs) : [],
          }));
          setBenefits(parsedBenefits);
        }
      } catch (error) {
        console.error("Error loading benefits:", error);
      } finally {
        setBenefitsLoading(false);
      }
    }

    loadBenefits();
  }, [auth0User, userLoading]);

  const handleProfileSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!auth0User?.email) {
      toast.error("You must be logged in to save your profile");
      return;
    }

    setSaving(true);
    try {
      // Map form fields back to database fields
      const updateData = {
        emailAddress: auth0User.email,
        FirstName: profileData.firstName.trim(),
        LastName: profileData.lastName.trim(),
        DateOfBirth: profileData.dateOfBirth.trim(),
        StreetAddress: profileData.address.trim(),
        PatientCity: profileData.city.trim(),
        PatientState: profileData.state.trim().toUpperCase(),
        InsuranceGroupNumber: profileData.insuranceGroupNumber.trim() || null,
        InsurancePlanType: profileData.insurancePlanType.trim(),
        InsuranceCompanyStreetAddress: profileData.insuranceCompanyAddress.trim() || null,
        InsuranceCompanyCity: profileData.insuranceCompanyCity.trim() || null,
        InsuranceCompanyState: profileData.insuranceCompanyState.trim() || null,
        InsuranceCompanyPhoneNumber: profileData.insuranceCompanyPhone.trim() || null,
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

  const handleSave = () => {
    // Save profile if on profile tab
    if (activeTab === "profile") {
      handleProfileSave();
    } else {
      // Save other settings (notifications, preferences, privacy)
      console.log("Saving settings:", settings);
      toast.success("Settings saved successfully!");
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "help", label: "Help & Support", icon: HelpCircle }
  ];

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <SettingsIcon className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Settings</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1 p-4">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSave}>
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
                          value={profileData.firstName}
                          onChange={(e) => handleProfileChange("firstName", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Last Name *
                        </label>
                        <Input
                          required
                          placeholder="Doe"
                          value={profileData.lastName}
                          onChange={(e) => handleProfileChange("lastName", e.target.value)}
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
                          value={profileData.dateOfBirth}
                          onChange={(e) => handleProfileChange("dateOfBirth", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Preferred Language
                        </label>
                        <select
                          value={profileData.preferredLanguage}
                          onChange={(e) => handleProfileChange("preferredLanguage", e.target.value)}
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
                        value={profileData.email || auth0User?.email || ""}
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
                        value={profileData.address}
                        onChange={(e) => handleProfileChange("address", e.target.value)}
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
                          value={profileData.city}
                          onChange={(e) => handleProfileChange("city", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          State *
                        </label>
                        <Input
                          required
                          placeholder="MA"
                          value={profileData.state}
                          onChange={(e) => handleProfileChange("state", e.target.value.toUpperCase())}
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
                        value={profileData.zipCode}
                        onChange={(e) => handleProfileChange("zipCode", e.target.value)}
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
                        value={profileData.insuranceCompany}
                        onChange={(e) => handleProfileChange("insuranceCompany", e.target.value)}
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
                          value={profileData.insuranceAccountNumber}
                          onChange={(e) => handleProfileChange("insuranceAccountNumber", e.target.value)}
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
                          value={profileData.insuranceGroupNumber}
                          onChange={(e) => handleProfileChange("insuranceGroupNumber", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Plan Type *
                      </label>
                      <select
                        value={profileData.insurancePlanType}
                        onChange={(e) => handleProfileChange("insurancePlanType", e.target.value)}
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
                          value={profileData.insuranceCompanyAddress}
                          onChange={(e) => handleProfileChange("insuranceCompanyAddress", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            City
                          </label>
                          <Input
                            placeholder="Boston"
                            value={profileData.insuranceCompanyCity}
                            onChange={(e) => handleProfileChange("insuranceCompanyCity", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            State
                          </label>
                          <Input
                            placeholder="MA"
                            value={profileData.insuranceCompanyState}
                            onChange={(e) => handleProfileChange("insuranceCompanyState", e.target.value)}
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
                          value={profileData.insuranceCompanyPhone}
                          onChange={(e) => handleProfileChange("insuranceCompanyPhone", e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance Benefits Section */}
                {benefitsLoading && (
                  <Card className="mb-6">
                    <CardContent className="pt-6 pb-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Loading benefits...</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!benefitsLoading && benefits.length > 0 && (
                  <Card className="mb-6 border-2 border-green-200 overflow-hidden py-0">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex flex-col">
                          <CardTitle className="text-2xl mb-1">Insurance Benefits</CardTitle>
                          <CardDescription className="m-0">
                            Your extracted insurance benefits information
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-6 pb-8 space-y-6">
                      {benefits.map((benefit, index) => (
                        <div key={benefit.id || index} className="border rounded-lg p-6 space-y-6">
                          {/* Plan Information */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Building className="h-5 w-5 text-blue-600" />
                              Plan Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Plan Name</p>
                                <p className="font-medium text-gray-900">{benefit.plan_name}</p>
                              </div>
                              {benefit.plan_type && (
                                <div>
                                  <p className="text-sm text-gray-600">Plan Type</p>
                                  <p className="font-medium text-gray-900">{benefit.plan_type}</p>
                                </div>
                              )}
                              {benefit.insurance_provider && (
                                <div>
                                  <p className="text-sm text-gray-600">Insurance Provider</p>
                                  <p className="font-medium text-gray-900">{benefit.insurance_provider}</p>
                                </div>
                              )}
                              {benefit.policy_number && (
                                <div>
                                  <p className="text-sm text-gray-600">Policy Number</p>
                                  <p className="font-medium text-gray-900">{benefit.policy_number}</p>
                                </div>
                              )}
                              {benefit.group_number && (
                                <div>
                                  <p className="text-sm text-gray-600">Group Number</p>
                                  <p className="font-medium text-gray-900">{benefit.group_number}</p>
                                </div>
                              )}
                              {benefit.effective_date && (
                                <div>
                                  <p className="text-sm text-gray-600">Effective Date</p>
                                  <p className="font-medium text-gray-900">
                                    {new Date(benefit.effective_date).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                              {benefit.expiration_date && (
                                <div>
                                  <p className="text-sm text-gray-600">Expiration Date</p>
                                  <p className="font-medium text-gray-900">
                                    {new Date(benefit.expiration_date).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Deductibles */}
                          {benefit.deductibles && benefit.deductibles.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deductibles</h3>
                              <div className="space-y-2">
                                {benefit.deductibles.map((deductible: any, idx: number) => (
                                  <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {deductible.amount !== null && deductible.amount !== undefined && (
                                        <div>
                                          <p className="text-sm text-gray-600">Amount</p>
                                          <p className="font-medium text-gray-900">${deductible.amount.toLocaleString()}</p>
                                        </div>
                                      )}
                                      {deductible.type && (
                                        <div>
                                          <p className="text-sm text-gray-600">Type</p>
                                          <p className="font-medium text-gray-900 capitalize">{deductible.type.replace('_', ' ')}</p>
                                        </div>
                                      )}
                                      {deductible.applies_to && (
                                        <div>
                                          <p className="text-sm text-gray-600">Applies To</p>
                                          <p className="font-medium text-gray-900 capitalize">{deductible.applies_to}</p>
                                        </div>
                                      )}
                                      {deductible.network && (
                                        <div>
                                          <p className="text-sm text-gray-600">Network</p>
                                          <p className="font-medium text-gray-900 capitalize">{deductible.network.replace('_', ' ')}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Copays */}
                          {benefit.copays && benefit.copays.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Copays</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {benefit.copays.map((copay: any, idx: number) => (
                                  <div key={idx} className="border rounded-lg p-4 bg-blue-50">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900 capitalize">
                                          {copay.service_type?.replace(/_/g, ' ') || 'N/A'}
                                        </p>
                                        {copay.network && (
                                          <p className="text-sm text-gray-600 capitalize">
                                            {copay.network.replace('_', ' ')} Network
                                          </p>
                                        )}
                                      </div>
                                      {copay.amount !== null && copay.amount !== undefined && (
                                        <p className="text-2xl font-bold text-blue-600">
                                          ${copay.amount}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Coinsurance */}
                          {benefit.coinsurance && benefit.coinsurance.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coinsurance</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {benefit.coinsurance.map((coinsurance: any, idx: number) => (
                                  <div key={idx} className="border rounded-lg p-4 bg-purple-50">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900 capitalize">
                                          {coinsurance.applies_to || 'N/A'}
                                        </p>
                                        {coinsurance.network && (
                                          <p className="text-sm text-gray-600 capitalize">
                                            {coinsurance.network.replace('_', ' ')} Network
                                          </p>
                                        )}
                                      </div>
                                      {coinsurance.percentage !== null && coinsurance.percentage !== undefined && (
                                        <p className="text-2xl font-bold text-purple-600">
                                          {coinsurance.percentage}%
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Out of Pocket Maximums */}
                          {(benefit.out_of_pocket_max_individual || benefit.out_of_pocket_max_family) && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Out of Pocket Maximums</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {benefit.out_of_pocket_max_individual && (
                                  <div className="border rounded-lg p-4 bg-orange-50">
                                    <p className="text-sm text-gray-600">Individual</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                      ${benefit.out_of_pocket_max_individual.toLocaleString()}
                                    </p>
                                  </div>
                                )}
                                {benefit.out_of_pocket_max_family && (
                                  <div className="border rounded-lg p-4 bg-orange-50">
                                    <p className="text-sm text-gray-600">Family</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                      ${benefit.out_of_pocket_max_family.toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Services Coverage */}
                          {benefit.services && benefit.services.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Coverage</h3>
                              <div className="space-y-2">
                                {benefit.services.map((service: any, idx: number) => (
                                  <div key={idx} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <p className="font-medium text-gray-900 capitalize">
                                            {service.service_name?.replace(/_/g, ' ') || 'N/A'}
                                          </p>
                                          {service.covered ? (
                                            <Badge className="bg-green-100 text-green-700">Covered</Badge>
                                          ) : (
                                            <Badge className="bg-red-100 text-red-700">Not Covered</Badge>
                                          )}
                                          {service.requires_preauth && (
                                            <Badge className="bg-yellow-100 text-yellow-700">Pre-auth Required</Badge>
                                          )}
                                        </div>
                                        {service.copay && (
                                          <p className="text-sm text-gray-600">
                                            Copay: ${service.copay.amount} ({service.copay.network?.replace('_', ' ')})
                                          </p>
                                        )}
                                        {service.coinsurance && (
                                          <p className="text-sm text-gray-600">
                                            Coinsurance: {service.coinsurance.percentage}% ({service.coinsurance.network?.replace('_', ' ')})
                                          </p>
                                        )}
                                        {service.notes && (
                                          <p className="text-sm text-gray-500 mt-2">{service.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Network Information */}
                          {(benefit.in_network_providers || benefit.out_of_network_coverage !== undefined || benefit.network_notes) && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Information</h3>
                              <div className="space-y-2">
                                {benefit.in_network_providers && (
                                  <div>
                                    <p className="text-sm text-gray-600">In-Network Providers</p>
                                    <p className="text-gray-900">{benefit.in_network_providers}</p>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-600">Out-of-Network Coverage:</p>
                                  {benefit.out_of_network_coverage ? (
                                    <Badge className="bg-green-100 text-green-700">Yes</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-700">No</Badge>
                                  )}
                                </div>
                                {benefit.network_notes && (
                                  <div>
                                    <p className="text-sm text-gray-600">Notes</p>
                                    <p className="text-gray-900">{benefit.network_notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Pre-authorization Requirements */}
                          {benefit.preauth_required_services && benefit.preauth_required_services.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pre-authorization Required</h3>
                              <div className="flex flex-wrap gap-2">
                                {benefit.preauth_required_services.map((service: string, idx: number) => (
                                  <Badge key={idx} className="bg-yellow-100 text-yellow-700">
                                    {service.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                              {benefit.preauth_notes && (
                                <p className="text-sm text-gray-600 mt-2">{benefit.preauth_notes}</p>
                              )}
                            </div>
                          )}

                          {/* Exclusions */}
                          {benefit.exclusions && benefit.exclusions.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Exclusions</h3>
                              <div className="flex flex-wrap gap-2">
                                {benefit.exclusions.map((exclusion: string, idx: number) => (
                                  <Badge key={idx} className="bg-red-100 text-red-700">
                                    {exclusion.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                              {benefit.exclusion_notes && (
                                <p className="text-sm text-gray-600 mt-2">{benefit.exclusion_notes}</p>
                              )}
                            </div>
                          )}

                          {/* Special Programs */}
                          {benefit.special_programs && benefit.special_programs.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Programs</h3>
                              <div className="flex flex-wrap gap-2">
                                {benefit.special_programs.map((program: string, idx: number) => (
                                  <Badge key={idx} className="bg-blue-100 text-blue-700">
                                    {program.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Coverage Limits */}
                          {benefit.coverage_limits && benefit.coverage_limits.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Limits</h3>
                              <div className="space-y-2">
                                {benefit.coverage_limits.map((limit: any, idx: number) => (
                                  <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {limit.limit_type && (
                                        <div>
                                          <p className="text-sm text-gray-600">Limit Type</p>
                                          <p className="font-medium text-gray-900 capitalize">{limit.limit_type.replace('_', ' ')}</p>
                                        </div>
                                      )}
                                      {limit.amount !== null && limit.amount !== undefined && (
                                        <div>
                                          <p className="text-sm text-gray-600">Amount</p>
                                          <p className="font-medium text-gray-900">${limit.amount.toLocaleString()}</p>
                                        </div>
                                      )}
                                      {limit.applies_to && (
                                        <div>
                                          <p className="text-sm text-gray-600">Applies To</p>
                                          <p className="font-medium text-gray-900 capitalize">{limit.applies_to}</p>
                                        </div>
                                      )}
                                      {limit.network && (
                                        <div>
                                          <p className="text-sm text-gray-600">Network</p>
                                          <p className="font-medium text-gray-900 capitalize">{limit.network.replace('_', ' ')}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Additional Information */}
                          {(benefit.additional_benefits || benefit.notes) && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                              {benefit.additional_benefits && (
                                <p className="text-gray-900 mb-2">{benefit.additional_benefits}</p>
                              )}
                              {benefit.notes && (
                                <p className="text-sm text-gray-600">{benefit.notes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </form>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about important updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive updates via email</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, email: !!checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">SMS Notifications</p>
                          <p className="text-sm text-gray-500">Receive text messages</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={settings.notifications.sms}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, sms: !!checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-500">Browser and app notifications</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, push: !!checked }
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Notification Types</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Appointment Reminders</p>
                          <p className="text-sm text-gray-500">Get reminded about upcoming appointments</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.appointmentReminders}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                appointmentReminders: !!checked
                              }
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Lab Results</p>
                          <p className="text-sm text-gray-500">Notify when lab results are available</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.labResults}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                labResults: !!checked
                              }
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Bill Updates</p>
                          <p className="text-sm text-gray-500">Updates on bill negotiation status</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.billUpdates}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                billUpdates: !!checked
                              }
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Claims Status</p>
                          <p className="text-sm text-gray-500">Updates on insurance claims</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.claimsStatus}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                claimsStatus: !!checked
                              }
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Marketing Emails</p>
                          <p className="text-sm text-gray-500">Receive updates about new features</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.marketing}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                marketing: !!checked
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences Settings */}
            {activeTab === "preferences" && (
              <Card>
                <CardHeader>
                  <CardTitle>App Preferences</CardTitle>
                  <CardDescription>
                    Customize your CarePilot experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Theme
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, theme: "light" }
                          })
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                          settings.preferences.theme === "light"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <Sun className="h-4 w-4" />
                        Light
                      </button>
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, theme: "dark" }
                          })
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                          settings.preferences.theme === "dark"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <Moon className="h-4 w-4" />
                        Dark
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Currency
                      </label>
                      <select
                        value={settings.preferences.currency}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, currency: e.target.value }
                          })
                        }
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Date Format
                      </label>
                      <select
                        value={settings.preferences.dateFormat}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, dateFormat: e.target.value }
                          })
                        }
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Time Format
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, timeFormat: "12h" }
                          })
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          settings.preferences.timeFormat === "12h"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        12 Hour
                      </button>
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, timeFormat: "24h" }
                          })
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          settings.preferences.timeFormat === "24h"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        24 Hour
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Privacy & Security Settings */}
            {activeTab === "privacy" && (
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Security</CardTitle>
                  <CardDescription>
                    Manage your privacy settings and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {settings.privacy.twoFactorAuth && (
                          <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                        )}
                        <Button
                          variant="outline"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              privacy: {
                                ...settings.privacy,
                                twoFactorAuth: !settings.privacy.twoFactorAuth
                              }
                            })
                          }
                        >
                          {settings.privacy.twoFactorAuth ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Share Data for Research</p>
                        <p className="text-sm text-gray-500">Help improve CarePilot (anonymized)</p>
                      </div>
                      <Checkbox
                        checked={settings.privacy.shareData}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, shareData: !!checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Analytics</p>
                        <p className="text-sm text-gray-500">Help us understand how you use CarePilot</p>
                      </div>
                      <Checkbox
                        checked={settings.privacy.analytics}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, analytics: !!checked }
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Account Actions</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Settings */}
            {activeTab === "billing" && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Payment</CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">Visa •••• 4242</p>
                          <p className="text-sm text-gray-500">Expires 12/25</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Billing History</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>No billing history available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help & Support Settings */}
            {activeTab === "help" && (
              <Card>
                <CardHeader>
                  <CardTitle>Help & Support</CardTitle>
                  <CardDescription>
                    Get help and contact support
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      FAQ & Documentation
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Report a Bug
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>CarePilot v1.0.0</p>
                      <p>© 2025 CarePilot. All rights reserved.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between">
              <Button variant="outline" asChild>
                <a href="/auth/logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </a>
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-blue-600 hover:bg-blue-700"
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
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
