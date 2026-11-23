
import { NextResponse } from 'next/server';
import {
  randomInt,
  randomUUID,
  createHash
} from 'crypto';

import { validateUser } from '@/lib/users';
import { saveOtp, deleteOtp } from '@/lib/otp-store';
import { sendOtpEmail } from '@/lib/mailer';

export const runtime = 'nodejs';

const loginAttempts = new Map();

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')
      ?.split(',')[0]?.trim() || 'unknown';

    const now = Date.now();
    const current = loginAttempts.get(ip);

    if (current && current.resetAt > now && current.count >= 10) {
      return NextResponse.json(
        { message: 'Too many login attempts. Try again later.' },
        { status: 429 }
      );
    }

    if (!current || current.resetAt <= now) {
      loginAttempts.set(ip, {
        count: 0,
        resetAt: now + 15 * 60 * 1000
      });
    }

    const body = await request.json();
    const { username, password } = body;

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      username.length > 100 ||
      password.length > 200
    ) {
      return NextResponse.json(
        { message: 'Invalid credentials.' },
        { status: 400 }
      );
    }

    const valid = await validateUser(username, password);

    if (!valid) {
      loginAttempts.get(ip).count++;

      return NextResponse.json(
        { message: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const otp = String(randomInt(100000, 1000000));
    const challengeId = randomUUID();

    const otpHash = createHash('sha256')
      .update(`${challengeId}:${otp}`)
      .digest('hex');

    saveOtp(challengeId, {
      username: username.trim(),
      otpHash
    });

    try {
    //   await sendOtpEmail(otp);
    await sendOtpEmail(otp, username.trim().toLowerCase());
    } catch (error) {
      deleteOtp(challengeId);

      console.error('OTP email failed:', error);

      return NextResponse.json(
        { message: 'Unable to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'OTP sent to your registered email.'
    });

    response.cookies.set('otp_challenge', challengeId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 300
    });

    return response;

  } catch (error) {
    console.error('Login API error:', error);

    return NextResponse.json(
      { message: 'Login failed.' },
      { status: 500 }
    );
  }
}
