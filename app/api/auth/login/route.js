
import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

import { validateUser } from '@/lib/users';
import { sendOtpEmail } from '@/lib/mailer';
import { createOtpChallenge } from '@/lib/otp-challenge';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();

    const { username, password } = body;

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !password ||
      password.length > 200
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid login details.' },
        { status: 400 }
      );
    }

    // 1. Validate configured user
    const normalizedUsername = username.trim().toLowerCase();

    const valid = await validateUser(
      normalizedUsername,
      password
    );

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password.'
        },
        { status: 401 }
      );
    }

    // 2. Generate six-digit OTP
    const otp = String(randomInt(100000, 1000000));

    // 3. Send OTP email with username
    await sendOtpEmail(otp, normalizedUsername);

    // 4. Create signed OTP challenge
    const challengeToken = await createOtpChallenge(
      normalizedUsername,
      otp
    );

    // 5. Store challenge in secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'OTP sent to your registered email.'
    });

    response.cookies.set('otp_challenge', challengeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 300
    });

    return response;

  } catch (error) {
    console.error('OTP email failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to send OTP. Please try again.'
      },
      { status: 500 }
    );
  }
}
