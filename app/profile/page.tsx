"use client";

import { useState } from "react";
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
  FileText
} from "lucide-react";

export default function ProfilePage() {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to backend
    console.log("Saving profile:", formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    // Here you would typically call an API to save the data
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-100/20">
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
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
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
            >
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

