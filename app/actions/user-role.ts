/**
 * Server Action for user role management
 * Server Actions work better with Auth0 SDK v4 than Route Handlers
 */

"use server";

import { auth0 } from "@/lib/auth0";
import { getUserByEmail, updateUser, createUser } from "@/lib/azure/sql-storage";

export async function getUserRole(): Promise<{ success: boolean; role: string | null; error?: string }> {
  try {
    // Get session - Server Actions work better with Auth0 SDK v4
    const session = await auth0.getSession();
    
    if (!session?.user?.email) {
      return {
        success: false,
        role: null,
        error: "Unauthorized"
      };
    }

    const userEmail = session.user.email;
    const user = await getUserByEmail(userEmail);

    if (!user) {
      return {
        success: true,
        role: null
      };
    }

    return {
      success: true,
      role: user.userRole || null
    };
  } catch (error: any) {
    console.error("Error getting user role:", error);
    return {
      success: false,
      role: null,
      error: error.message || "Failed to get user role"
    };
  }
}

export async function setUserRole(role: "patient" | "doctor"): Promise<{ success: boolean; error?: string }> {
  try {
    // Get session - Server Actions work better with Auth0 SDK v4
    const session = await auth0.getSession();
    
    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    if (!role || (role !== "patient" && role !== "doctor")) {
      return {
        success: false,
        error: "Invalid role. Must be 'patient' or 'doctor'"
      };
    }

    const userEmail = session.user.email;

    // Check if user exists in database
    let user = await getUserByEmail(userEmail);

    // Extract OAuth information from Auth0 session
    const oauthProvider = session.user.sub?.split('|')[0] || 'auth0'; // e.g., 'google-oauth2', 'auth0'
    const oauthProviderId = session.user.sub || null; // Auth0 user ID
    const oauthEmail = session.user.email || userEmail;

    if (user) {
      // Update existing user with role and OAuth info (if not already set)
      const updates: any = { userRole: role };
      if (!user.oauth_provider && oauthProviderId) {
        updates.oauth_provider = oauthProvider;
        updates.oauth_provider_id = oauthProviderId;
        updates.oauth_email = oauthEmail;
      }
      await updateUser(userEmail, updates);
    } else {
      // User doesn't exist yet, create a minimal user record with role and OAuth info
      const userName = session.user.name || "User";
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(' ') || "";
      
      // Create minimal user record with role and OAuth information
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
        oauth_provider: oauthProvider,
        oauth_provider_id: oauthProviderId || undefined,
        oauth_email: oauthEmail,
      });
    }

    return {
      success: true
    };
  } catch (error: any) {
    console.error("Error setting user role:", error);
    return {
      success: false,
      error: error.message || "Failed to set user role"
    };
  }
}

