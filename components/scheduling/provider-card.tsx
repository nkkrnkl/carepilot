"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Languages, 
  Video,
  CheckCircle2,
  Star
} from "lucide-react";

export interface Slot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  mode: "in-person" | "telehealth";
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  address: string;
  distance: string;
  travelTime: string;
  languages: string[];
  telehealth: boolean;
  inNetwork: boolean;
  rating?: number;
  slots: Slot[];
  reasons: string[];
  estimatedCost: number;
  image?: string;
}

interface ProviderCardProps {
  provider: Provider;
  onSelectSlot: (providerId: string, slotId: string) => void;
  selectedSlotId?: string;
}

export function ProviderCard({ provider, onSelectSlot, selectedSlotId }: ProviderCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{provider.name}</h3>
              {provider.inNetwork && (
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  In-Network
                </Badge>
              )}
            </div>
            <p className="text-gray-600 font-medium mb-2">{provider.specialty}</p>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{provider.distance} • {provider.travelTime}</span>
              </div>
              {provider.telehealth && (
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  <Video className="h-3 w-3 mr-1" />
                  Telehealth
                </Badge>
              )}
              {provider.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{provider.rating}</span>
                </div>
              )}
            </div>
          </div>
          {/* Provider Image/Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-20 w-20 border-2 border-gray-200">
              <AvatarImage 
                src={provider.image} 
                alt={provider.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                {getInitials(provider.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Languages */}
          {provider.languages.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Languages className="h-4 w-4 text-gray-400" />
              <div className="flex gap-1 flex-wrap">
                {provider.languages.map((lang, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reason Codes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">Why this pick?</p>
            <ul className="text-xs text-blue-800 space-y-1">
              {provider.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-blue-600">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cost Estimate */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-900">Estimated Cost</p>
                <p className="text-lg font-bold text-green-700">${provider.estimatedCost}</p>
                <p className="text-xs text-green-600">after deductible</p>
              </div>
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Available Slots</p>
            <div className="grid grid-cols-2 gap-2">
              {provider.slots.slice(0, 4).map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedSlotId === slot.id ? "default" : slot.available ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => slot.available && onSelectSlot(provider.id, slot.id)}
                  disabled={!slot.available}
                  className={`flex flex-col items-center justify-center h-auto py-2 ${
                    !slot.available ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : ''
                  }`}
                >
                  <span className="text-xs font-medium">{slot.date}</span>
                  <span className="text-xs">{slot.time}</span>
                  {slot.mode === "telehealth" && (
                    <Video className="h-3 w-3 mt-1" />
                  )}
                  {!slot.available && (
                    <span className="text-xs mt-1 text-gray-500">Booked</span>
                  )}
                </Button>
              ))}
            </div>
            {provider.slots.length > 4 && (
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                View {provider.slots.length - 4} more slots
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

