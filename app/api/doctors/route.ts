/**
 * API Route to fetch doctors data from Azure Blob Storage
 * GET /api/doctors
 */

import { NextResponse } from "next/server";
import { downloadDoctorsData } from "@/lib/azure/blob-storage";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const specialty = searchParams.get('specialty');
    const zipCode = searchParams.get('zipCode');
    const telehealth = searchParams.get('telehealth');
    const language = searchParams.get('language');
    
    // Download doctors data from Azure Blob Storage
    let doctors = await downloadDoctorsData();
    
    // If no doctors found in blob storage, return empty array with error info
    if (doctors.length === 0) {
      console.warn("No doctors found in Azure Blob Storage");
      return NextResponse.json({
        success: false,
        count: 0,
        data: [],
        error: "No doctors data found in Azure Blob Storage"
      });
    }
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      doctors = doctors.filter((doctor: any) => 
        doctor.name.toLowerCase().includes(searchLower) ||
        doctor.specialty.toLowerCase().includes(searchLower) ||
        doctor.address.toLowerCase().includes(searchLower)
      );
    }
    
    if (specialty) {
      doctors = doctors.filter((doctor: any) => 
        doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
      );
    }
    
    if (telehealth === 'true') {
      doctors = doctors.filter((doctor: any) => doctor.telehealth === true);
    }
    
    if (language) {
      doctors = doctors.filter((doctor: any) => 
        doctor.languages.some((lang: string) => 
          lang.toLowerCase().includes(language.toLowerCase())
        )
      );
    }
    
    // Return doctors data
    return NextResponse.json({
      success: true,
      count: doctors.length,
      data: doctors,
      source: "azure-blob-storage"
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

