"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Video,
  Loader2
} from "lucide-react";
import { useUser } from '@auth0/nextjs-auth0/client';
import { PatientNavbar } from "@/components/layout/patient-navbar";
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
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
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
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
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
    image: "https://images.unsplash.com/photo-1594824476968-48fd8d3c9b8b?w=200&h=200&fit=crop&crop=face",
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
  const { user, isLoading: authLoading } = useUser();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Function to mark slots as unavailable based on existing appointments
  const markBookedSlots = (providersData: Provider[], appointments: any[]) => {
    return providersData.map(provider => {
      // Ensure slots is an array (handle cases where it might be a string or undefined)
      let slots: Slot[] = [];
      if (Array.isArray(provider.slots)) {
        slots = provider.slots;
      } else if (typeof provider.slots === 'string') {
        try {
          slots = JSON.parse(provider.slots);
        } catch (e) {
          console.warn(`Failed to parse slots for provider ${provider.id}:`, e);
          slots = [];
        }
      } else if (provider.slots) {
        // Try to convert to array if it's an object
        slots = Object.values(provider.slots) as Slot[];
      }
      
      // Find appointments for this provider
      const providerAppointments = appointments.filter(apt => apt.doctorId === provider.id && apt.status === 'scheduled');
      
      // Mark slots as unavailable if they match an existing appointment
      const updatedSlots = slots.map(slot => {
        // Check if this slot matches any appointment
        const isBooked = providerAppointments.some(apt => {
          // Parse appointment date/time
          const aptDate = new Date(apt.appointmentDate);
          const aptTime = apt.appointmentTime || aptDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          
          // Normalize times for comparison (handle variations like "9:30 AM" vs "9:30AM")
          const normalizeTime = (time: string) => {
            return time.trim().replace(/\s+/g, ' ').toUpperCase();
          };
          
          const slotTimeMatch = normalizeTime(slot.time) === normalizeTime(aptTime);
          const slotTypeMatch = (slot.mode === 'telehealth' && apt.appointmentType === 'telehealth') ||
                                (slot.mode === 'in-person' && apt.appointmentType === 'in-person');
          
          // Try to match dates - parse slot date if possible
          // Slot format: "Tue, Nov 12" or similar
          // Appointment date: ISO string
          let dateMatch = false;
          try {
            // Extract day and month from slot date (e.g., "Nov 12" from "Tue, Nov 12")
            const slotDateParts = slot.date.match(/(\w+)\s+(\d+)/);
            if (slotDateParts) {
              const slotMonth = slotDateParts[1]; // e.g., "Nov"
              const slotDay = parseInt(slotDateParts[2]); // e.g., 12
              
              // Get month and day from appointment date
              const aptMonth = aptDate.toLocaleDateString('en-US', { month: 'short' }); // e.g., "Nov"
              const aptDay = aptDate.getDate();
              
              dateMatch = slotMonth === aptMonth && slotDay === aptDay;
            } else {
              // If we can't parse the date, match by time and type only
              dateMatch = true; // Assume match if we can't parse
            }
          } catch (e) {
            // If date parsing fails, match by time and type only
            dateMatch = true;
          }
          
          return slotTimeMatch && slotTypeMatch && dateMatch;
        });
        
        return {
          ...slot,
          available: !isBooked && slot.available
        };
      });
      
      return {
        ...provider,
        slots: updatedSlots
      };
    });
  };

  // Fetch providers and appointments from API
  useEffect(() => {
    async function fetchProvidersAndAppointments() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch providers
        console.log("🔍 Fetching doctors from API...");
        const providersResponse = await fetch('/api/doctors');
        
        if (!providersResponse.ok) {
          throw new Error(`API returned ${providersResponse.status}: ${providersResponse.statusText}`);
        }
        
        const providersResult = await providersResponse.json();
        console.log("📊 API Response:", {
          success: providersResult.success,
          count: providersResult.count,
          source: providersResult.source,
          hasData: !!providersResult.data,
          dataLength: providersResult.data?.length || 0
        });
        
        let providersData: Provider[] = [];
        if (providersResult.success && providersResult.data && providersResult.data.length > 0) {
          console.log(`✅ Loaded ${providersResult.data.length} providers from ${providersResult.source || 'API'} (database: ${providersResult.database || 'unknown'})`);
          
          // Ensure all providers have properly formatted data
          providersData = providersResult.data.map((provider: any) => {
            // Ensure slots is always an array
            let slots: Slot[] = [];
            if (Array.isArray(provider.slots)) {
              slots = provider.slots;
            } else if (typeof provider.slots === 'string') {
              try {
                slots = JSON.parse(provider.slots);
              } catch (e) {
                console.warn(`Failed to parse slots for provider ${provider.id}:`, e);
                slots = [];
              }
            }
            
            // Ensure languages is always an array
            let languages: string[] = [];
            if (Array.isArray(provider.languages)) {
              languages = provider.languages;
            } else if (typeof provider.languages === 'string') {
              try {
                languages = JSON.parse(provider.languages);
              } catch (e) {
                console.warn(`Failed to parse languages for provider ${provider.id}:`, e);
                languages = [];
              }
            }
            
            // Ensure reasons is always an array
            let reasons: string[] = [];
            if (Array.isArray(provider.reasons)) {
              reasons = provider.reasons;
            } else if (typeof provider.reasons === 'string') {
              try {
                reasons = JSON.parse(provider.reasons);
              } catch (e) {
                console.warn(`Failed to parse reasons for provider ${provider.id}:`, e);
                reasons = [];
              }
            }
            
            return {
              ...provider,
              slots,
              languages,
              reasons,
              // Ensure required fields have defaults
              distance: provider.distance || "Unknown",
              travelTime: provider.travelTime || "Unknown",
              estimatedCost: provider.estimatedCost || 0,
            };
          });
          
          setError(null); // Clear any previous errors
        } else if (providersResult.data && providersResult.data.length === 0) {
          console.warn("⚠️ API returned empty array, using mock providers");
          setError("No doctors found in database. Using mock data.");
          providersData = mockProviders;
        } else {
          console.warn("⚠️ API returned no data, using mock providers");
          setError(`API error: ${providersResult.error || 'Unknown error'}. Using mock data.`);
          providersData = mockProviders;
        }
        
        // Fetch existing appointments to mark slots as unavailable
        try {
          const appointmentsResponse = await fetch('/api/appointments');
          const appointmentsResult = await appointmentsResponse.json();
          
          if (appointmentsResult.success && appointmentsResult.appointments) {
            // Mark booked slots as unavailable
            const updatedProviders = markBookedSlots(providersData, appointmentsResult.appointments);
            setProviders(updatedProviders);
          } else {
            setProviders(providersData);
          }
        } catch (aptErr) {
          console.error("Error fetching appointments:", aptErr);
          // Continue with providers even if appointments fetch fails
          setProviders(providersData);
        }
      } catch (err) {
        console.error("Error fetching providers:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Full error:", errorMessage);
        
        // Check if it's a database connection error
        if (errorMessage.includes("AZURE_SQL") || errorMessage.includes("Login failed") || errorMessage.includes("connection")) {
          setError(`Database connection error: ${errorMessage}. Please check your Azure SQL credentials in .env.local`);
        } else {
          setError(`Failed to load providers: ${errorMessage}. Using mock data.`);
        }
        setProviders(mockProviders);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProvidersAndAppointments();
  }, []);

  const handleSearch = async (query: string, filters: FilterState) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (filters.telehealth) params.append('telehealth', 'true');
      if (filters.language) params.append('language', filters.language);
      // Note: FilterState may not have specialty, so we skip it for now
      
      const response = await fetch(`/api/doctors?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setProviders(result.data);
      } else {
        // Fallback to mock data
        console.warn("API search returned no data, using mock providers");
        setProviders(mockProviders);
      }
    } catch (err) {
      console.error("Error searching providers:", err);
      setError("Search failed. Using mock data.");
      setProviders(mockProviders);
    } finally {
      setLoading(false);
    }
  };

  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleSelectSlot = (providerId: string, slotId: string) => {
    setSelectedProvider(providerId);
    setSelectedSlot(slotId);
    setIsBookingOpen(true);
    setBookingError(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedProviderData || !selectedSlotData) return;

    try {
      setIsBooking(true);
      setBookingError(null);

      // Get user email from Auth0
      if (!user?.email) {
        throw new Error('You must be logged in to book an appointment. Please sign in first.');
      }
      const userEmail = user.email;

      // Parse date and time from slot
      // Slot format: "Tue, Nov 12" and "9:30 AM"
      // We need to convert this to a proper datetime
      const slotDate = selectedSlotData.date; // e.g., "Tue, Nov 12"
      const slotTime = selectedSlotData.time; // e.g., "9:30 AM"
      
      // Create a proper datetime string
      // For now, we'll use today's date + the time, or parse the date string
      // In production, you'd want to properly parse the date string
      const now = new Date();
      const [time, period] = slotTime.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      
      // Create appointment date (for demo, use next week if date is in the future)
      // In production, parse the actual date from slotDate
      const appointmentDate = new Date(now);
      appointmentDate.setDate(now.getDate() + 7); // Default to next week
      appointmentDate.setHours(hour24, parseInt(minutes), 0, 0);
      
      const appointmentDateTime = appointmentDate.toISOString();

      // Create appointment via API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmailAddress: userEmail,
          doctorId: selectedProviderData.id,
          appointmentDate: appointmentDateTime,
          appointmentTime: slotTime,
          appointmentType: selectedSlotData.mode === 'telehealth' ? 'telehealth' : 'in-person',
          status: 'scheduled',
          estimatedCost: selectedProviderData.estimatedCost,
          notes: `Appointment with ${selectedProviderData.name} for ${selectedProviderData.specialty}`,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create appointment');
      }

      // Success! Mark the slot as unavailable in the UI
      setProviders(prevProviders => {
        return prevProviders.map(provider => {
          if (provider.id === selectedProviderData.id) {
            return {
              ...provider,
              slots: provider.slots.map(slot => {
                if (slot.id === selectedSlot) {
                  return {
                    ...slot,
                    available: false
                  };
                }
                return slot;
              })
            };
          }
          return provider;
        });
      });

      setIsConfirmed(true);
      setIsBookingOpen(false);
      setSelectedProvider(null);
      setSelectedSlot(null);
      
      // Refresh appointments to ensure all slots are up to date
      try {
        const appointmentsResponse = await fetch('/api/appointments');
        const appointmentsResult = await appointmentsResponse.json();
        
        if (appointmentsResult.success && appointmentsResult.appointments) {
          setProviders(prevProviders => markBookedSlots(prevProviders, appointmentsResult.appointments));
        }
      } catch (refreshErr) {
        console.error("Error refreshing appointments:", refreshErr);
      }
      
      // Show success message for 5 seconds
      setTimeout(() => setIsConfirmed(false), 5000);
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      setBookingError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);
  const selectedSlotData = selectedProviderData?.slots.find(s => s.id === selectedSlot);

  return (
    <div className="min-h-screen bg-gray-50">
      <PatientNavbar />

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

      {/* Info Banner - Show database connection status */}
      {providers.length > 0 && providers.length !== mockProviders.length && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">
                Loaded {providers.length} doctors from database
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {bookingError && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{bookingError}</span>
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
            setBookingError(null);
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
          isBooking={isBooking}
          error={bookingError}
        />
      )}
    </div>
  );
}
