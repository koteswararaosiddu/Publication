
import { NextResponse } from 'next/server';
import { get, put } from '@vercel/blob';
import ExcelJS from 'exceljs';
import { parsePublicationText } from '@/lib/parser';
import { verifySession } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

// ----------------------------------------------------
// Filename helpers
// ----------------------------------------------------

function sanitizeFileName(name) {
  return String(name || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

function removeExtension(fileName) {
  return fileName.replace(/\.[^/.]+$/, '');
}

// ----------------------------------------------------
// Process publication TXT file
// ----------------------------------------------------

export async function POST(request) {
  try {
    // 1. Authentication

    const sessionToken = request.cookies.get('session')?.value;
    const session = await verifySession(sessionToken);

    if (!session || typeof session.username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login again.' },
        { status: 401 }
      );
    }

    // 2. Request validation

    const body = await request.json();

    const {
      blobUrl,
      source,
      originalFileName
    } = body;

    const validSources = ['pubmed', 'europepmc', 'others'];
    const selectedSource = String(source || '').toLowerCase();

    if (!blobUrl || typeof blobUrl !== 'string') {
      return NextResponse.json(
        { error: 'Uploaded Blob URL is required.' },
        { status: 400 }
      );
    }

    if (!validSources.includes(selectedSource)) {
      return NextResponse.json(
        { error: 'Invalid publication source.' },
        { status: 400 }
      );
    }

    if (
      !String(originalFileName || '')
        .toLowerCase()
        .endsWith('.txt')
    ) {
      return NextResponse.json(
        { error: 'Only TXT files are supported.' },
        { status: 400 }
      );
    }

    // 3. Read private Blob

    console.time('Blob download');

    const blob = await get(blobUrl, {
      access: 'private'
    });

    if (!blob?.stream) {
      throw new Error('Unable to read uploaded file from Blob.');
    }

    const text = await new Response(blob.stream).text();

    console.timeEnd('Blob download');

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'The uploaded file is empty.' },
        { status: 400 }
      );
    }

    console.log(
      'Input file size:',
      (Buffer.byteLength(text, 'utf8') / 1024 / 1024).toFixed(2),
      'MB'
    );

    // 4. Generate filenames

    const safeOriginalName = sanitizeFileName(originalFileName);
    const originalBaseName = removeExtension(safeOriginalName);

    const baseFileName =
      `${selectedSource}_${originalBaseName}`;

    // 5. Parse publication text

    console.time('Publication parsing');

    const result = parsePublicationText(
      text,
      selectedSource
    );

    const rows = result.rows || [];

    console.timeEnd('Publication parsing');

    console.log('Parsing statistics:', result.stats);

    // 6. Create Excel workbook

    console.time('Excel generation');

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Publication Data Extractor';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Publications');

    // Author and Email are adjacent

    const columns = [
      'article_number',
      'source',
      'journal',
      'title',
      'author',
      'email',
      'author_number',
      'doi',
      'pmid',
      'country',
      'author_count',
      'email_count',
      'authors'
    ];

    // 7. Column widths

    const widths = {
      article_number: 14,
      source: 15,
      journal: 22,
      title: 60,
      author: 30,
      email: 45,
      author_number: 18,
      doi: 35,
      pmid: 16,
      country: 24,
      author_count: 15,
      email_count: 15,
      authors: 65
    };

    worksheet.columns = columns.map(key => ({
      header: key,
      key,
      width: widths[key] || 24
    }));

    // 8. Add all records

    if (rows.length > 0) {
      worksheet.addRows(rows);
    }

    // 9. Header formatting

    const header = worksheet.getRow(1);

    header.height = 25;

    header.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FFFFFF00'
        }
      };

      cell.font = {
        bold: true,
        color: {
          argb: 'FF000000'
        }
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };

      cell.border = {
        bottom: {
          style: 'thin',
          color: {
            argb: 'FF808080'
          }
        }
      };
    });

    // 10. Data formatting

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      row.eachCell(cell => {
        cell.alignment = {
          vertical: 'top',
          horizontal: 'left',
          wrapText: true
        };
      });
    });

    // 11. Freeze header

    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1
      }
    ];

    // 12. Enable filters

    worksheet.autoFilter = {
      from: 'A1',
      to: `${worksheet.getColumn(worksheet.columnCount).letter}1`
    };

    // 13. Generate Excel buffer

    const excelBuffer = await workbook.xlsx.writeBuffer();

    console.timeEnd('Excel generation');

    console.log(
      'Excel buffer size:',
      (excelBuffer.byteLength / 1024 / 1024).toFixed(2),
      'MB'
    );

    // 14. Save Excel to private Blob

    console.time('Excel Blob upload');

    const outputBlob = await put(
      `outputs/${session.username}/${baseFileName}.xlsx`,
      Buffer.from(excelBuffer),
      {
        access: 'private',
        addRandomSuffix: true,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    );

    console.timeEnd('Excel Blob upload');

    // 15. Return result

    return NextResponse.json({
      success: true,

      rows: rows.slice(0, 50),

      stats: result.stats || null,

      source: selectedSource,

      originalFileName: safeOriginalName,

      baseFileName,

      outputFileName: `${baseFileName}.xlsx`,

      outputBlobPathname: outputBlob.pathname,

      totalRows: rows.length
    });

  } catch (error) {
    console.error('Process API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message ||
          'Unable to process the uploaded file.'
      },
      { status: 500 }
    );
  }
}
