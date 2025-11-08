/**
 * API Route for user role management
 * POST /api/users/role - Set user role (patient or doctor)
 * GET /api/users/role - Get user role
 */

import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { getUserByEmail, updateUser, createUser } from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { role } = await request.json();
    
    if (!role || (role !== "patient" && role !== "doctor")) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'patient' or 'doctor'" },
        { status: 400 }
      );
    }

    const userEmail = session.user.email;

    // Check if user exists in database
    let user = await getUserByEmail(userEmail);

    if (user) {
      // Update existing user with role
      await updateUser(userEmail, { userRole: role });
    } else {
      // User doesn't exist yet, create a minimal user record with role
      // This allows users to set their role before filling out their full profile
      const userName = session.user.name || "User";
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(' ') || "";
      
      // Create minimal user record with role
      await createUser({
        emailAddress: userEmail,
        FirstName: firstName,
        LastName: lastName,
        DateOfBirth: "1900-01-01", // Placeholder, user should update this in profile
        StreetAddress: "", // Placeholder
        PatientCity: "", // Placeholder
        PatientState: "", // Placeholder
        InsurancePlanType: "Other", // Placeholder
        userRole: role,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Role set successfully",
      role 
    });
  } catch (error: any) {
    console.error("Error setting user role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to set user role" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const user = await getUserByEmail(userEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      role: user.userRole || null 
    });
  } catch (error: any) {
    console.error("Error getting user role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get user role" },
      { status: 500 }
    );
  }
}

