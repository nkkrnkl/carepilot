/**
 * API Route to fetch doctors data from Azure SQL Database
 * GET /api/doctors
 */

import { NextResponse } from "next/server";
import { listDoctors, type DoctorEntity, type DoctorSlot } from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic';

/**
 * Convert SQL doctor entity to API response format
 */
function formatDoctorForApi(doctor: DoctorEntity) {
  return {
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialty,
    address: doctor.address,
    distance: doctor.distance,
    travelTime: doctor.travelTime,
    languages: doctor.languages ? JSON.parse(doctor.languages) : [],
    telehealth: doctor.telehealth,
    inNetwork: doctor.inNetwork,
    rating: doctor.rating,
    image: doctor.image,
    slots: doctor.slots ? JSON.parse(doctor.slots) as DoctorSlot[] : [],
    reasons: doctor.reasons ? JSON.parse(doctor.reasons) : [],
    estimatedCost: doctor.estimatedCost,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const specialty = searchParams.get('specialty');
    const telehealth = searchParams.get('telehealth');
    const language = searchParams.get('language');
    const inNetwork = searchParams.get('inNetwork');
    
    // Build filters
    const filters: {
      search?: string;
      specialty?: string;
      telehealth?: boolean;
      language?: string;
      inNetwork?: boolean;
    } = {};

    if (search) {
      filters.search = search;
    }

    if (specialty) {
      filters.specialty = specialty;
    }

    if (telehealth === 'true') {
      filters.telehealth = true;
    }

    if (language) {
      filters.language = language;
    }

    if (inNetwork === 'true') {
      filters.inNetwork = true;
    }
    
    // Fetch doctors from SQL Database
    let doctors = await listDoctors(filters);
    
    // Apply additional language filtering in application layer
    // (since JSON parsing in SQL is complex)
    if (language && !filters.language) {
      doctors = doctors.filter((doctor) => {
        try {
          const languages: string[] = doctor.languages ? JSON.parse(doctor.languages) : [];
          return languages.some((lang: string) => 
            lang.toLowerCase().includes(language.toLowerCase())
          );
        } catch {
          return false;
        }
      });
    }
    
    // Format doctors for API response
    const formattedDoctors = doctors.map(formatDoctorForApi);
    
    // Return doctors data
    return NextResponse.json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors,
      source: "azure-sql-database"
    });
    
  } catch (error: any) {
    console.error("Error fetching doctors data:", error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch doctors data",
        message: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

