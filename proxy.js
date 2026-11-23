
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request) {
  const token = request.cookies.get('session')?.value;

  let authenticated = false;

  if (token && process.env.AUTH_SECRET) {
    try {
      const secret = new TextEncoder().encode(
        process.env.AUTH_SECRET
      );

      const { payload } = await jwtVerify(token, secret);

      authenticated =
        payload.authenticated === true &&
        typeof payload.username === 'string';
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/extract/:path*',
    '/api/process/:path*'
  ]
};
