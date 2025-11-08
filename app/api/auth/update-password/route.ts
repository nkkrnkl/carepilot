/**
 * API Route for Updating User Password
 * POST /api/auth/update-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateUser } from '@/lib/azure/sql-storage';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailAddress, currentPassword, newPassword } = body;

    // Validate required fields
    if (!emailAddress || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Email, current password, and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await getUserByEmail(emailAddress);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has a password hash
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Password not set for this account' },
        { status: 400 }
      );
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await updateUser(emailAddress, {
      password_hash: newPasswordHash,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Password updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password', details: error.message },
      { status: 500 }
    );
  }
}

