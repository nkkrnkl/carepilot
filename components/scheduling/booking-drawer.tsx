"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  CheckCircle2,
  Download,
  X
} from "lucide-react";

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    name: string;
    specialty: string;
    address: string;
    slot: {
      date: string;
      time: string;
      mode: "in-person" | "telehealth";
    };
    estimatedCost: number;
  };
  onConfirm: () => void;
}

export function BookingDrawer({ isOpen, onClose, provider, onConfirm }: BookingDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Confirm Appointment</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              <p className="text-gray-600">{provider.specialty}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{provider.slot.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{provider.slot.time}</span>
              </div>
              {provider.slot.mode === "telehealth" ? (
                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Telehealth Appointment</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{provider.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-900">Estimated Cost</p>
                  <p className="text-2xl font-bold text-green-700">${provider.estimatedCost}</p>
                  <p className="text-xs text-green-600">after deductible</p>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  In-Network
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Prep Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prep Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>No fasting required for this appointment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Bring your insurance card and ID</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Arrive 15 minutes early for check-in</span>
                </li>
                {provider.slot.mode === "telehealth" && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>Test your video connection before the appointment</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={onConfirm} className="w-full" size="lg">
              Confirm Appointment
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

