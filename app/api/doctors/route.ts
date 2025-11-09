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
  // Safely parse JSON fields with error handling
  let languages: string[] = [];
  if (doctor.languages) {
    if (Array.isArray(doctor.languages)) {
      languages = doctor.languages;
    } else if (typeof doctor.languages === 'string') {
      try {
        languages = JSON.parse(doctor.languages);
        if (!Array.isArray(languages)) {
          console.warn(`Languages for doctor ${doctor.id} is not an array:`, languages);
          languages = [];
        }
      } catch (e) {
        console.warn(`Failed to parse languages for doctor ${doctor.id}:`, e);
        languages = [];
      }
    }
  }
  
  let slots: DoctorSlot[] = [];
  if (doctor.slots) {
    if (Array.isArray(doctor.slots)) {
      slots = doctor.slots;
    } else if (typeof doctor.slots === 'string') {
      try {
        const parsed = JSON.parse(doctor.slots);
        slots = Array.isArray(parsed) ? parsed : [];
        if (!Array.isArray(slots)) {
          console.warn(`Slots for doctor ${doctor.id} is not an array:`, parsed);
          slots = [];
        }
      } catch (e) {
        console.warn(`Failed to parse slots for doctor ${doctor.id}:`, e);
        slots = [];
      }
    }
  }
  
  let reasons: string[] = [];
  if (doctor.reasons) {
    if (Array.isArray(doctor.reasons)) {
      reasons = doctor.reasons;
    } else if (typeof doctor.reasons === 'string') {
      try {
        reasons = JSON.parse(doctor.reasons);
        if (!Array.isArray(reasons)) {
          console.warn(`Reasons for doctor ${doctor.id} is not an array:`, reasons);
          reasons = [];
        }
      } catch (e) {
        console.warn(`Failed to parse reasons for doctor ${doctor.id}:`, e);
        reasons = [];
      }
    }
  }
  
  return {
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialty,
    address: doctor.address,
    distance: doctor.distance || null,
    travelTime: doctor.travelTime || null,
    languages,
    telehealth: doctor.telehealth || false,
    inNetwork: doctor.inNetwork || false,
    rating: doctor.rating || null,
    image: doctor.image || null,
    slots,
    reasons,
    estimatedCost: doctor.estimatedCost || null,
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
    
    // Log for debugging
    console.log(`✅ Fetched ${formattedDoctors.length} doctors from Azure SQL Database (K2Database.doctorInformation_table)`);
    
    // Return doctors data
    return NextResponse.json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors,
      source: "azure-sql-database",
      database: process.env.AZURE_SQL_DATABASE || "K2Database",
      table: "doctorInformation_table"
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

