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
} from "@/lib/azure/table-storage";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (email) {
      const user = await getUserByEmail(email);
      if (!user) {
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
      "firstName",
      "lastName",
      "dateOfBirth",
      "email",
      "phoneNumber",
      "address",
      "city",
      "state",
      "zipCode",
      "insuranceCompany",
      "accountNumber",
      "planType",
    ];

    for (const field of requiredFields) {
      if (!userData[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    await createUser(userData as Omit<UserEntity, "partitionKey" | "rowKey" | "timestamp">);
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
    const { email, ...updates } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    await updateUser(email, updates);
    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

