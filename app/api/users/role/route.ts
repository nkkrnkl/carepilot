/**
 * API Route for user role management
 * POST /api/users/role - Set user role (patient or doctor)
 * GET /api/users/role - Get user role
 */

import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getUserByEmail, updateUser, createUser } from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log("Role API: POST request received");
    
    // Get session - in App Router, getSession() can be called without parameters
    const session = await auth0.getSession();
    
    console.log("Role API: Session retrieved:", session ? "exists" : "null");
    
    if (!session?.user?.email) {
      console.error("Role API: No session or email found");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    console.log("Role API: User email:", userEmail);

    const body = await request.json();
    console.log("Role API: Request body:", body);
    const { role } = body;
    
    if (!role || (role !== "patient" && role !== "doctor")) {
      console.error("Role API: Invalid role:", role);
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'patient' or 'doctor'" },
        { status: 400 }
      );
    }

    console.log("Role API: Setting role to:", role, "for user:", userEmail);

    // Check if user exists in database
    console.log("Role API: Checking if user exists in database...");
    let user = null;
    try {
      user = await getUserByEmail(userEmail);
      console.log("Role API: User lookup result:", user ? "found" : "not found");
    } catch (error: any) {
      console.error("Role API: Error checking user:", error.message);
      // Continue to create user if lookup fails
    }

    if (user) {
      // Update existing user with role
      console.log(`Role API: Updating existing user ${userEmail} with role ${role}`);
      try {
        await updateUser(userEmail, { userRole: role });
        console.log(`Role API: Successfully updated user ${userEmail} with role ${role}`);
      } catch (error: any) {
        console.error(`Role API: Error updating user:`, error);
        throw new Error(`Failed to update user role: ${error.message}`);
      }
    } else {
      // User doesn't exist yet, create a minimal user record with role
      // This allows users to set their role before filling out their full profile
      const userName = session.user.name || userEmail.split('@')[0] || "User";
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(' ') || "User";
      
      console.log(`Role API: Creating new user ${userEmail} with role ${role}`);
      console.log(`Role API: User name: ${firstName} ${lastName}`);
      
      // Create minimal user record with role
      // Note: Required fields must have valid values
      const userData = {
        emailAddress: userEmail,
        FirstName: firstName,
        LastName: lastName,
        DateOfBirth: "2000-01-01", // Placeholder date (must be valid date format)
        StreetAddress: "TBD", // Placeholder - required field
        PatientCity: "TBD", // Placeholder - required field
        PatientState: "TBD", // Placeholder - required field
        InsurancePlanType: "Other", // Required field with default value
        userRole: role,
      };
      
      console.log("Role API: User data to create:", JSON.stringify(userData, null, 2));
      
      try {
        await createUser(userData);
        console.log(`Role API: User ${userEmail} created successfully with role ${role}`);
      } catch (error: any) {
        console.error(`Role API: Error creating user:`, error);
        console.error(`Role API: Error stack:`, error.stack);
        throw new Error(`Failed to create user: ${error.message}`);
      }
    }

    // Verify the role was saved by fetching the user again
    console.log("Role API: Verifying role was saved...");
    try {
      const verifyUser = await getUserByEmail(userEmail);
      console.log("Role API: Verified user role:", verifyUser?.userRole);
      
      if (verifyUser?.userRole !== role) {
        console.error(`Role API: Role mismatch! Expected: ${role}, Got: ${verifyUser?.userRole}`);
        throw new Error(`Role was not saved correctly. Expected: ${role}, Got: ${verifyUser?.userRole || "null"}`);
      }
    } catch (error: any) {
      console.error("Role API: Error verifying role:", error.message);
      // Don't fail if verification fails, but log it
    }

    console.log("Role API: Successfully set role:", role, "for user:", userEmail);
    return NextResponse.json({ 
      success: true, 
      message: "Role set successfully",
      role 
    });
  } catch (error: any) {
    console.error("Role API: Error setting user role:", error);
    console.error("Role API: Error stack:", error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to set user role",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session - in App Router, getSession() can be called without parameters
    const session = await auth0.getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const user = await getUserByEmail(userEmail);

    if (!user) {
      // User doesn't exist in database yet - return success with null role
      // This allows the frontend to handle role selection
      return NextResponse.json({ 
        success: true, 
        role: null 
      });
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

