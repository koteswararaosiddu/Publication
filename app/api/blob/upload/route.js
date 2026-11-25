
import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { verifySession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // 1. Verify logged-in user
    const sessionToken = request.cookies.get('session')?.value;
    const session = await verifySession(sessionToken);

    if (!session || typeof session.username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login again.' },
        { status: 401 }
      );
    }

    // 2. Handle secure direct upload token exchange
    const body = await request.json();

    const response = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname) => {
        // 3. Allow only TXT files up to 100 MB
        if (!pathname.toLowerCase().endsWith('.txt')) {
          throw new Error('Only TXT files are allowed.');
        }

        return {
          allowedContentTypes: ['text/plain'],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
          access: 'private',
          tokenPayload: JSON.stringify({
            username: session.username
          })
        };
      }
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Blob upload API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unable to authorize file upload.'
      },
      { status: 400 }
    );
  }
}
