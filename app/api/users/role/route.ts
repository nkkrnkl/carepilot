/**
 * API Route for user role management
 * POST /api/users/role - Set user role (patient or doctor)
 * GET /api/users/role - Get user role
 * 
 * NOTE: This route uses a workaround for Auth0 SDK v4 Route Handler issues.
 * The client passes the user email, and we validate it against the database.
 * For better security, consider using Server Actions instead.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser, createUser } from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, role, oauthProvider, oauthProviderId, oauthEmail, firstName, lastName } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }
    
    if (!role || (role !== "patient" && role !== "doctor")) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'patient' or 'doctor'" },
        { status: 400 }
      );
    }

    // Check if user exists in database
    let user = await getUserByEmail(email);

    // Extract name from firstName/lastName or email
    const nameParts = email.split('@');
    const userFirstName = firstName || nameParts[0] || "User";
    const userLastName = lastName || "";

    if (user) {
      // Update existing user with role and OAuth info (if provided and not already set)
      const updates: any = { userRole: role };
      if (oauthProviderId && !user.oauth_provider_id) {
        updates.oauth_provider = oauthProvider || "auth0";
        updates.oauth_provider_id = oauthProviderId;
        updates.oauth_email = oauthEmail || email;
      }
      await updateUser(email, updates);
    } else {
      // User doesn't exist yet, create a minimal user record with role and OAuth info
      await createUser({
        emailAddress: email,
        FirstName: userFirstName,
        LastName: userLastName,
        DateOfBirth: "1900-01-01", // Placeholder, user should update this in profile
        StreetAddress: "", // Placeholder
        PatientCity: "", // Placeholder
        PatientState: "", // Placeholder
        InsurancePlanType: "Other", // Placeholder
        userRole: role,
        // OAuth fields (if provided)
        oauth_provider: oauthProvider || undefined,
        oauth_provider_id: oauthProviderId || undefined,
        oauth_email: oauthEmail || email,
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

export async function GET(request: NextRequest) {
  try {
    // WORKAROUND: Get user email from query parameter
    // TODO: Fix Auth0 SDK v4 Route Handler session access
    // The proper solution would be to use getSession() but it has issues with NextRequest.cookies
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");
    
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(userEmail);

    if (!user) {
      // User not in database - return null role
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
