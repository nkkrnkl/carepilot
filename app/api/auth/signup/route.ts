/**
 * API Route for User Sign Up
 * POST /api/auth/signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/azure/sql-storage';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      emailAddress,
      password,
      FirstName,
      LastName,
      DateOfBirth,
      StreetAddress,
      PatientCity,
      PatientState,
      InsurancePlanType,
      userRole,
      providerId,
      insurerId,
    } = body;

    // Validate required fields
    if (!emailAddress || !password || !FirstName || !LastName || !InsurancePlanType) {
      return NextResponse.json(
        { error: 'Missing required fields: emailAddress, password, FirstName, LastName, InsurancePlanType' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(emailAddress);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    await createUser({
      emailAddress,
      FirstName,
      LastName,
      DateOfBirth: DateOfBirth || null,
      StreetAddress: StreetAddress || '',
      PatientCity: PatientCity || '',
      PatientState: PatientState || '',
      InsurancePlanType,
      userRole: userRole || 'patient',
      providerId: providerId || null,
      insurerId: insurerId || null,
      password_hash,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: {
          emailAddress,
          FirstName,
          LastName,
          userRole: userRole || 'patient',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

