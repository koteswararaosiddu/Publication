
import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { verifySession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    const session = await verifySession(sessionToken);

    if (!session || typeof session.username !== 'string') {
      return NextResponse.json(
        { error: 'Unauthorized. Please login again.' },
        { status: 401 }
      );
    }

    const { pathname } = await request.json();

    if (
      typeof pathname !== 'string' ||
      !pathname.startsWith(`outputs/${session.username}/`) ||
      !pathname.endsWith('.xlsx')
    ) {
      return NextResponse.json(
        { error: 'Invalid download request.' },
        { status: 403 }
      );
    }

    const blob = await get(pathname, { access: 'private' });

    if (!blob?.stream) {
      return NextResponse.json(
        { error: 'Excel file not found.' },
        { status: 404 }
      );
    }

    const fileName = pathname.split('/').pop().replace(/["\r\n]/g, '_');

    return new NextResponse(blob.stream, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, no-store'
      }
    });
  } catch (error) {
    console.error('Download API error:', error);

    return NextResponse.json(
      { error: 'Unable to download the Excel file.' },
      { status: 500 }
    );
  }
}
