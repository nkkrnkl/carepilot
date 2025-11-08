/**
 * API Route for User Sign In
 * POST /api/auth/signin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/azure/sql-storage';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailAddress, password } = body;

    // Validate required fields
    if (!emailAddress || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await getUserByEmail(emailAddress);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user has a password hash (some users might not have passwords if created before this feature)
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Password not set for this account. Please reset your password.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return user data (without password hash)
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: 'Sign in successful',
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Failed to sign in', details: error.message },
      { status: 500 }
    );
  }
}

