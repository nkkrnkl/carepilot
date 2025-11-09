/**
 * API Route to check if user profile is complete
 * GET /api/users/complete-profile?email=... - Check if profile is complete
 * POST /api/users/complete-profile - Update user profile with complete information
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser } from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Check if user profile is complete
 * A profile is considered complete if all required fields are filled (not empty/placeholder)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({
        success: true,
        isComplete: false,
        missingFields: ["all"],
        message: "User not found"
      });
    }

    // Check if profile is complete
    const missingFields: string[] = [];
    
    // Helper function to check if a string field is empty
    const isEmptyString = (value: any): boolean => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') {
        return value.trim() === "";
      }
      return false;
    };
    
    // Helper function to format date for comparison
    const formatDate = (date: any): string => {
      if (!date) return "";
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
      if (typeof date === 'string') {
        return date.split('T')[0]; // Handle ISO strings
      }
      return String(date);
    };
    
    // Required fields for a complete profile
    if (isEmptyString(user.FirstName) || user.FirstName === "User") {
      missingFields.push("FirstName");
    }
    if (isEmptyString(user.LastName)) {
      missingFields.push("LastName");
    }
    
    // DateOfBirth can be a Date object or string from SQL Server
    const dateOfBirthStr = formatDate(user.DateOfBirth);
    if (!dateOfBirthStr || dateOfBirthStr === "1900-01-01" || dateOfBirthStr === "") {
      missingFields.push("DateOfBirth");
    }
    
    if (isEmptyString(user.StreetAddress)) {
      missingFields.push("StreetAddress");
    }
    if (isEmptyString(user.PatientCity)) {
      missingFields.push("PatientCity");
    }
    if (isEmptyString(user.PatientState)) {
      missingFields.push("PatientState");
    }
    if (isEmptyString(user.InsurancePlanType) || user.InsurancePlanType === "Other") {
      missingFields.push("InsurancePlanType");
    }

    const isComplete = missingFields.length === 0;

    return NextResponse.json({
      success: true,
      isComplete,
      missingFields,
      user: {
        emailAddress: user.emailAddress,
        FirstName: user.FirstName || "",
        LastName: user.LastName || "",
        DateOfBirth: formatDate(user.DateOfBirth) || "",
        StreetAddress: user.StreetAddress || "",
        PatientCity: user.PatientCity || "",
        PatientState: user.PatientState || "",
        InsurancePlanType: user.InsurancePlanType || "",
        userRole: user.userRole || "",
      }
    });
  } catch (error: any) {
    console.error("Error checking profile completeness:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check profile completeness" },
      { status: 500 }
    );
  }
}

/**
 * Update user profile with complete information
 */
export async function POST(request: NextRequest) {
  try {
    const { email, ...profileData } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      "FirstName",
      "LastName",
      "DateOfBirth",
      "StreetAddress",
      "PatientCity",
      "PatientState",
      "InsurancePlanType",
    ];

    // Helper function to check if a value is empty
    const isEmpty = (value: any): boolean => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') {
        return value.trim() === "";
      }
      return false;
    };

    for (const field of requiredFields) {
      const value = profileData[field];
      
      // DateOfBirth is a date field - check if it's empty or invalid
      if (field === "DateOfBirth") {
        // Check if DateOfBirth is missing, empty, or is the placeholder date
        if (isEmpty(value) || value === "1900-01-01" || value === "1900-01-01T00:00:00.000Z") {
          console.error(`Missing DateOfBirth field. Received: ${JSON.stringify(value)}, Type: ${typeof value}`);
          return NextResponse.json(
            { success: false, error: `Missing required field: ${field}. Please provide a valid date of birth.` },
            { status: 400 }
          );
        }
        // Validate date format (should be YYYY-MM-DD)
        if (typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          console.error(`Invalid DateOfBirth format. Received: ${value}`);
          return NextResponse.json(
            { success: false, error: `Invalid date format for ${field}. Expected YYYY-MM-DD format.` },
            { status: 400 }
          );
        }
      } else {
        // String fields
        if (isEmpty(value)) {
          console.error(`Missing field: ${field}. Received: ${JSON.stringify(value)}`);
          return NextResponse.json(
            { success: false, error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
    }
    
    // Log the data being received for debugging
    console.log("Profile data received:", JSON.stringify(profileData, null, 2));

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update user profile
    await updateUser(email, profileData);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}

