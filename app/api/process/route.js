
import { NextResponse } from 'next/server';
import { parsePublicationText } from '@/lib/parser';
import { verifySession } from '@/lib/auth';

export const runtime = 'nodejs';

function sanitizeFileName(name) {
  return String(name || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

function removeExtension(fileName) {
  return fileName.replace(/\.[^/.]+$/, '');
}

export async function POST(request) {
  try {
    // --------------------------------------------
    // 1. Verify authenticated session
    // --------------------------------------------

    const sessionToken = request.cookies.get('session')?.value;

    const session = await verifySession(sessionToken);

    if (!session || typeof session.username !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please login again.'
        },
        {
          status: 401
        }
      );
    }

    // --------------------------------------------
    // 2. Read form data
    // --------------------------------------------

    const formData = await request.formData();

    const file = formData.get('file');

    const source = String(
      formData.get('source') || 'others'
    ).toLowerCase();

    // --------------------------------------------
    // 3. Validate file
    // --------------------------------------------

    if (!file || typeof file.text !== 'function') {
      return NextResponse.json(
        {
          error: 'TXT file is required.'
        },
        {
          status: 400
        }
      );
    }

    if (!file.name?.toLowerCase().endsWith('.txt')) {
      return NextResponse.json(
        {
          error: 'Only .txt files are supported.'
        },
        {
          status: 400
        }
      );
    }

    // --------------------------------------------
    // 4. Read file directly into memory
    // NO FILE STORAGE
    // --------------------------------------------

    const text = await file.text();

    if (!text.trim()) {
      return NextResponse.json(
        {
          error: 'The uploaded file is empty.'
        },
        {
          status: 400
        }
      );
    }

    // --------------------------------------------
    // 5. Original filename
    // --------------------------------------------

    const originalFileName = sanitizeFileName(
      file.name
    );

    const originalBaseName =
      removeExtension(originalFileName);

    // --------------------------------------------
    // 6. Output filename
    // --------------------------------------------

    const baseFileName =
      `${source}_${originalBaseName}`;

    // --------------------------------------------
    // 7. Parse publication text
    // --------------------------------------------

    const result = parsePublicationText(
      text,
      source
    );

    // --------------------------------------------
    // 8. Return parsed data
    // --------------------------------------------

    return NextResponse.json({
      ...result,

      source,

      originalFileName,

      baseFileName,

      jsonFileName: `${baseFileName}.json`,

      csvFileName: `${baseFileName}.csv`
    });

  } catch (error) {
    console.error(
      'Process API error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Unable to process the uploaded file.'
      },
      {
        status: 500
      }
    );
  }
}
