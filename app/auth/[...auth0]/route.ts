/**
 * Auth0 route handler for /auth/* routes
 * This matches the implementation from the combine-aymaan-niki-abhinavlabs branch.
 * Handles routes like /auth/login, /auth/logout, /auth/callback, /auth/me
 * 
 * Note: Auth0 SDK v4 uses /api/auth/* by default, but we create this route
 * to support /auth/* routes for consistency with the other branch.
 */

import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Auth0Client middleware handles all routing automatically
    return await auth0.middleware(request);
  } catch (error: any) {
    console.error("Auth0 route handler error:", error);
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
