
import { NextResponse } from 'next/server';
import {
  createHash,
  timingSafeEqual
} from 'crypto';

import {
  getOtp,
  deleteOtp,
  incrementOtpAttempts
} from '@/lib/otp-store';

import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const challengeId = request.cookies.get(
      'otp_challenge'
    )?.value;

    if (!challengeId) {
      return NextResponse.json(
        { message: 'OTP session missing. Please login again.' },
        { status: 401 }
      );
    }

    const challenge = getOtp(challengeId);

    if (!challenge) {
      return NextResponse.json(
        { message: 'OTP expired or invalid. Please login again.' },
        { status: 401 }
      );
    }

    if (challenge.attempts >= 5) {
      deleteOtp(challengeId);

      return NextResponse.json(
        { message: 'Maximum OTP attempts exceeded.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { otp } = body;

    if (
      typeof otp !== 'string' ||
      !/^\d{6}$/.test(otp)
    ) {
      incrementOtpAttempts(challengeId);

      return NextResponse.json(
        { message: 'Please enter a valid six-digit OTP.' },
        { status: 400 }
      );
    }

    const submittedHash = createHash('sha256')
      .update(`${challengeId}:${otp}`)
      .digest('hex');

    const expected = Buffer.from(challenge.otpHash, 'hex');
    const submitted = Buffer.from(submittedHash, 'hex');

    const valid =
      expected.length === submitted.length &&
      timingSafeEqual(expected, submitted);

    if (!valid) {
      incrementOtpAttempts(challengeId);

      return NextResponse.json(
        { message: 'Incorrect OTP. Please try again.' },
        { status: 401 }
      );
    }

    // Delete OTP immediately after successful verification.
    deleteOtp(challengeId);

    // Create authenticated session.
    const token = await createSession(challenge.username);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      redirect: '/extract'
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60
    });

    // Remove temporary OTP cookie.
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
      { message: 'OTP verification failed.' },
      { status: 500 }
    );
  }
}
