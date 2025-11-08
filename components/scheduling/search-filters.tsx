"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, MapPin, Video, Clock, Languages } from "lucide-react";
import { useState } from "react";

export interface FilterState {
  distance: string;
  telehealth: boolean;
  language: string;
  timePreference: string;
  zipCode: string;
}

interface SearchFiltersProps {
  onSearch: (query: string, filters: FilterState) => void;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    distance: "10",
    telehealth: false,
    language: "",
    timePreference: "",
    zipCode: "",
  });

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const clearFilters = () => {
    setFilters({
      distance: "10",
      telehealth: false,
      language: "",
      timePreference: "",
      zipCode: "",
    });
    setQuery("");
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Book endocrinology next week near me; mornings; Spanish; telehealth ok"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-base"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <select
            value={filters.distance}
            onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
            className="text-sm border rounded-md px-2 py-1 bg-white"
          >
            <option value="5">Within 5 miles</option>
            <option value="10">Within 10 miles</option>
            <option value="25">Within 25 miles</option>
            <option value="50">Within 50 miles</option>
          </select>
        </div>

        <Button
          variant={filters.telehealth ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters({ ...filters, telehealth: !filters.telehealth })}
          className="flex items-center gap-1"
        >
          <Video className="h-4 w-4" />
          Telehealth
        </Button>

        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-gray-400" />
          <select
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            className="text-sm border rounded-md px-2 py-1 bg-white"
          >
            <option value="">Any Language</option>
            <option value="spanish">Spanish</option>
            <option value="chinese">Chinese</option>
            <option value="french">French</option>
            <option value="arabic">Arabic</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <select
            value={filters.timePreference}
            onChange={(e) => setFilters({ ...filters, timePreference: e.target.value })}
            className="text-sm border rounded-md px-2 py-1 bg-white"
          >
            <option value="">Any Time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>

        <Input
          placeholder="Zip code"
          value={filters.zipCode}
          onChange={(e) => setFilters({ ...filters, zipCode: e.target.value })}
          className="w-24 text-sm"
        />

        <Button onClick={handleSearch} className="ml-auto">
          Search
        </Button>

        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}

