/**
 * API Route for user management
 * GET /api/users - List all users or get user by email
 * POST /api/users - Create a new user
 * PUT /api/users - Update user
 */

import { NextResponse } from "next/server";
import {
  createUser,
  getUserByEmail,
  updateUser,
  listUsers,
  type UserEntity,
} from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailAddress = searchParams.get("emailAddress") || searchParams.get("email");

    console.log("GET /api/users - Email requested:", emailAddress);

    if (emailAddress) {
      const user = await getUserByEmail(emailAddress);
      console.log("Database query result:", {
        email: emailAddress,
        found: !!user,
        userEmail: user?.emailAddress,
        firstName: user?.FirstName,
        lastName: user?.LastName
      });
      
      if (!user) {
        console.log("User not found in database for email:", emailAddress);
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, user });
    }

    const users = await listUsers();
    return NextResponse.json({ success: true, users, count: users.length });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // Validate required fields
    const requiredFields = [
      "FirstName",
      "LastName",
      "DateOfBirth",
      "emailAddress",
      "StreetAddress",
      "PatientCity",
      "PatientState",
      "InsurancePlanType",
    ];

    for (const field of requiredFields) {
      if (!userData[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    await createUser(userData as UserEntity);
    return NextResponse.json({ success: true, message: "User created successfully" });
  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (error.statusCode === 409) {
      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { emailAddress, ...updates } = await request.json();

    if (!emailAddress) {
      return NextResponse.json(
        { success: false, error: "emailAddress is required" },
        { status: 400 }
      );
    }

    await updateUser(emailAddress, updates);
    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

