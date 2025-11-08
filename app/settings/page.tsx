"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Settings as SettingsIcon
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    profile: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main St",
      city: "Cambridge",
      state: "MA",
      zipCode: "02139",
      language: "en",
      timezone: "America/New_York"
    },
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

  const [activeTab, setActiveTab] = useState("profile");

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log("Saving settings:", settings);
    alert("Settings saved successfully!");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "help", label: "Help & Support", icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/" className="flex items-center gap-2">
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
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </nav>

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
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        First Name
                      </label>
                      <Input
                        value={settings.profile.firstName}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            profile: { ...settings.profile, firstName: e.target.value }
                          })
                        }
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Last Name
                      </label>
                      <Input
                        value={settings.profile.lastName}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            profile: { ...settings.profile, lastName: e.target.value }
                          })
                        }
                        placeholder="Last Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, email: e.target.value }
                        })
                      }
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={settings.profile.phone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, phone: e.target.value }
                        })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </label>
                    <Input
                      value={settings.profile.address}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, address: e.target.value }
                        })
                      }
                      placeholder="Street Address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        City
                      </label>
                      <Input
                        value={settings.profile.city}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            profile: { ...settings.profile, city: e.target.value }
                          })
                        }
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        State
                      </label>
                      <Input
                        value={settings.profile.state}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            profile: { ...settings.profile, state: e.target.value }
                          })
                        }
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Zip Code
                      </label>
                      <Input
                        value={settings.profile.zipCode}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            profile: { ...settings.profile, zipCode: e.target.value }
                          })
                        }
                        placeholder="Zip Code"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Language
                      </label>
                      <select
                        value={settings.profile.language}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            profile: { ...settings.profile, language: e.target.value }
                          })
                        }
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="zh">Chinese</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Timezone
                      </label>
                      <select
                        value={settings.profile.timezone}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            profile: { ...settings.profile, timezone: e.target.value }
                          })
                        }
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                <Link href="/">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Link>
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

