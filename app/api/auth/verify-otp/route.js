
import { NextResponse } from 'next/server';

import { verifyOtpChallenge } from '@/lib/otp-challenge';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // 1. Get signed OTP challenge cookie
    const challengeToken =
      request.cookies.get('otp_challenge')?.value;

    if (!challengeToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'OTP expired or invalid. Please login again.'
        },
        { status: 401 }
      );
    }

    // 2. Read submitted OTP
    const body = await request.json();
    const { otp } = body;

    // 3. Verify signed challenge and OTP
    const challenge = await verifyOtpChallenge(
      challengeToken,
      otp
    );

    if (!challenge) {
      return NextResponse.json(
        {
          success: false,
          message: 'OTP expired or invalid. Please login again.'
        },
        { status: 401 }
      );
    }

    // 4. Create authenticated session
    const sessionToken = await createSession(
      challenge.username
    );

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      redirect: '/extract'
    });

    // 5. Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 4 * 60 * 60
    });

    // 6. Clear OTP challenge cookie
    response.cookies.set('otp_challenge', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('OTP verification error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to verify OTP. Please try again.'
      },
      { status: 500 }
    );
  }
}
