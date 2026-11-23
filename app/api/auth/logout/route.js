
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
    redirect: '/login'
  });

  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });

  response.cookies.set('otp_challenge', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });

  return response;
}
