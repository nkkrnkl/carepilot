/**
 * Auth0 route handler
 * This catch-all route handles all Auth0 authentication routes:
 * - /api/auth/login
 * - /api/auth/logout
 * - /api/auth/callback
 * - /api/auth/me
 * 
 * The Auth0Client middleware automatically routes based on the path.
 * This matches the implementation from the combine-aymaan-niki-abhinavlabs branch.
 */

import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Auth0Client middleware handles all routing automatically
    return await auth0.middleware(request);
  } catch (error: any) {
    console.error("Auth0 route handler error:", error);
    // If middleware fails, allow the request to continue
    // This prevents the entire app from crashing if Auth0 has issues
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth0Client middleware handles all routing automatically
    return await auth0.middleware(request);
  } catch (error: any) {
    console.error("Auth0 route handler error:", error);
    throw error;
  }
}

