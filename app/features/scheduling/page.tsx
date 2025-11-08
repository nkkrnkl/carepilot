"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Video
} from "lucide-react";
import { ProviderCard, Provider, Slot } from "@/components/scheduling/provider-card";
import { SearchFilters, FilterState } from "@/components/scheduling/search-filters";
import { BookingDrawer } from "@/components/scheduling/booking-drawer";

// Mock data
const mockProviders: Provider[] = [
  {
    id: "1",
    name: "Dr. Sarah Martinez",
    specialty: "Endocrinology",
    address: "123 Medical Center Dr, Cambridge, MA 02139",
    distance: "2.3 miles",
    travelTime: "12 min drive",
    languages: ["English", "Spanish"],
    telehealth: true,
    inNetwork: true,
    rating: 4.8,
    slots: [
      { id: "1-1", date: "Tue, Nov 12", time: "9:30 AM", available: true, mode: "telehealth" as const },
      { id: "1-2", date: "Tue, Nov 12", time: "2:00 PM", available: true, mode: "in-person" as const },
      { id: "1-3", date: "Wed, Nov 13", time: "10:00 AM", available: true, mode: "telehealth" as const },
      { id: "1-4", date: "Thu, Nov 14", time: "8:30 AM", available: true, mode: "in-person" as const },
    ],
    reasons: [
      "In-network with your plan",
      "12 min drive from your location",
      "Spanish-speaking provider",
      "Available next week"
    ],
    estimatedCost: 45
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialty: "Endocrinology",
    address: "456 Healthcare Ave, Boston, MA 02115",
    distance: "4.1 miles",
    travelTime: "18 min drive",
    languages: ["English", "Chinese"],
    telehealth: true,
    inNetwork: true,
    rating: 4.9,
    slots: [
      { id: "2-1", date: "Mon, Nov 11", time: "11:00 AM", available: true, mode: "telehealth" as const },
      { id: "2-2", date: "Tue, Nov 12", time: "3:30 PM", available: true, mode: "in-person" as const },
      { id: "2-3", date: "Wed, Nov 13", time: "9:00 AM", available: true, mode: "telehealth" as const },
    ],
    reasons: [
      "In-network with your plan",
      "High patient ratings",
      "Telehealth available",
      "Early morning slots"
    ],
    estimatedCost: 50
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    specialty: "Endocrinology",
    address: "789 Wellness St, Cambridge, MA 02140",
    distance: "3.5 miles",
    travelTime: "15 min drive",
    languages: ["English", "Spanish"],
    telehealth: false,
    inNetwork: true,
    rating: 4.7,
    slots: [
      { id: "3-1", date: "Tue, Nov 12", time: "8:00 AM", available: true, mode: "in-person" as const },
      { id: "3-2", date: "Wed, Nov 13", time: "1:30 PM", available: true, mode: "in-person" as const },
      { id: "3-3", date: "Thu, Nov 14", time: "10:30 AM", available: true, mode: "in-person" as const },
    ],
    reasons: [
      "In-network with your plan",
      "Closest to your location",
      "Spanish-speaking provider",
      "Morning availability"
    ],
    estimatedCost: 40
  },
];

export default function SchedulingPage() {
  const [providers, setProviders] = useState(mockProviders);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSearch = (query: string, filters: FilterState) => {
    // In a real app, this would call the API
    console.log("Searching with:", { query, filters });
    // Filter providers based on search criteria
    setProviders(mockProviders);
  };

  const handleSelectSlot = (providerId: string, slotId: string) => {
    setSelectedProvider(providerId);
    setSelectedSlot(slotId);
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = () => {
    setIsConfirmed(true);
    setIsBookingOpen(false);
    // In a real app, this would call the booking API
    setTimeout(() => setIsConfirmed(false), 5000);
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);
  const selectedSlotData = selectedProviderData?.slots.find(s => s.id === selectedSlot);

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
                <Calendar className="h-6 w-6 text-green-600" />
                <span className="text-xl font-bold text-gray-900">Scheduling</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Success Banner */}
      {isConfirmed && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Appointment confirmed! Check your email for details.</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700">Feature</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book Your Appointment
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Find in-network clinicians that match your schedule, language, and location. 
            We'll show you 3-5 best options with cost estimates and let you book in one tap.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search for Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <SearchFilters onSearch={handleSearch} />
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {providers.length} Providers Found
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>All providers are in-network</span>
            </div>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onSelectSlot={handleSelectSlot}
              selectedSlotId={selectedSlot === provider.id ? selectedSlot : undefined}
            />
          ))}
        </div>

        {/* How It Works */}
        <Card className="border-2 border-green-200 bg-green-50/50 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xl mb-3">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Search & Filter</h3>
                <p className="text-sm text-gray-600">
                  Enter your needs, location, and preferences. We'll find in-network providers that match.
                </p>
              </div>
              <div>
                <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xl mb-3">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Review Options</h3>
                <p className="text-sm text-gray-600">
                  See 3-5 ranked options with cost estimates, travel time, and reason codes.
                </p>
              </div>
              <div>
                <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xl mb-3">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Book & Confirm</h3>
                <p className="text-sm text-gray-600">
                  Select a slot, confirm your appointment, and receive prep instructions and reminders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Safety Note</p>
                <p className="text-sm text-blue-800">
                  Informational support only. Final bookings and prep are user-approved. 
                  We don't replace your providers or portals—we coordinate with them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Drawer */}
      {selectedProviderData && selectedSlotData && (
        <BookingDrawer
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setSelectedProvider(null);
            setSelectedSlot(null);
          }}
          provider={{
            name: selectedProviderData.name,
            specialty: selectedProviderData.specialty,
            address: selectedProviderData.address,
            slot: {
              date: selectedSlotData.date,
              time: selectedSlotData.time,
              mode: selectedSlotData.mode,
            },
            estimatedCost: selectedProviderData.estimatedCost,
          }}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
}
