import { NextResponse } from 'next/server';
import { parsePublicationText } from '@/lib/parser';

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
    const formData = await request.formData();

    const file = formData.get('file');

    const source = String(
      formData.get('source') || 'others'
    ).toLowerCase();

    // --------------------------------------------
    // Validate file
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
    // Read file directly into memory
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
    // Original filename
    // --------------------------------------------

    const originalFileName = sanitizeFileName(
      file.name
    );

    const originalBaseName =
      removeExtension(
        originalFileName
      );

    // --------------------------------------------
    // Output filename
    //
    // pubmed_abstract-chemistal-set
    // --------------------------------------------

    const baseFileName =
      `${source}_${originalBaseName}`;

    // --------------------------------------------
    // Parse
    // --------------------------------------------

    const result =
      parsePublicationText(
        text,
        source
      );

    // --------------------------------------------
    // Return parsed data
    // --------------------------------------------

    return NextResponse.json({
      ...result,

      source,

      originalFileName,

      baseFileName,

      jsonFileName:
        `${baseFileName}.json`,

      csvFileName:
        `${baseFileName}.csv`
    });

  } catch (error) {

    console.error(
      'Process API error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Unable to process the uploaded file.'
      },
      {
        status: 500
      }
    );
  }
}
// import { NextResponse } from 'next/server';
// import { mkdir, writeFile } from 'node:fs/promises';
// import path from 'node:path';
// import { parsePublicationText } from '@/lib/parser';

// export const runtime = 'nodejs';

// function sanitizeFileName(name) {
//   return String(name || '')
//     .replace(/[^a-zA-Z0-9._-]/g, '_')
//     .replace(/_+/g, '_');
// }

// function removeExtension(fileName) {
//   return fileName.replace(/\.[^/.]+$/, '');
// }

// export async function POST(request) {
//   try {
//     const formData = await request.formData();

//     const file = formData.get('file');
//     const source = String(
//       formData.get('source') || 'others'
//     ).toLowerCase();

//     // --------------------------------------------
//     // Validate file
//     // --------------------------------------------

//     if (!file || typeof file.text !== 'function') {
//       return NextResponse.json(
//         {
//           error: 'TXT file is required.'
//         },
//         {
//           status: 400
//         }
//       );
//     }

//     if (!file.name?.toLowerCase().endsWith('.txt')) {
//       return NextResponse.json(
//         {
//           error: 'Only .txt files are supported.'
//         },
//         {
//           status: 400
//         }
//       );
//     }

//     // --------------------------------------------
//     // Read uploaded file
//     // --------------------------------------------

//     const text = await file.text();

//     if (!text.trim()) {
//       return NextResponse.json(
//         {
//           error: 'The uploaded file is empty.'
//         },
//         {
//           status: 400
//         }
//       );
//     }

//     // --------------------------------------------
//     // Original uploaded filename
//     //
//     // Example:
//     // abstract-chemistal-set.txt
//     // --------------------------------------------

//     const originalFileName = path.basename(
//       file.name
//     );

//     const safeOriginalFileName =
//       sanitizeFileName(originalFileName);

//     // --------------------------------------------
//     // Remove .txt
//     //
//     // abstract-chemistal-set.txt
//     //        ↓
//     // abstract-chemistal-set
//     // --------------------------------------------

//     const originalBaseName =
//       removeExtension(safeOriginalFileName);

//     // --------------------------------------------
//     // Create source prefix
//     //
//     // pubmed
//     // europepmc
//     // others
//     // --------------------------------------------

//     const safeSource =
//       sanitizeFileName(source);

//     // --------------------------------------------
//     // FINAL SOURCE FILE NAME
//     //
//     // pubmed_abstract-chemistal-set.txt
//     // --------------------------------------------

//     const sourceFileName =
//       `${safeSource}_${originalBaseName}.txt`;

//     // --------------------------------------------
//     // Upload directory
//     // --------------------------------------------

//     const uploadDir = path.join(
//       process.cwd(),
//       'data',
//       'uploads'
//     );

//     await mkdir(uploadDir, {
//       recursive: true
//     });

//     // --------------------------------------------
//     // Save source file
//     // --------------------------------------------

//     await writeFile(
//       path.join(
//         uploadDir,
//         sourceFileName
//       ),
//       text,
//       'utf8'
//     );

//     // --------------------------------------------
//     // Parse publication text
//     // --------------------------------------------

//     const result = parsePublicationText(
//       text,
//       source
//     );

//     // --------------------------------------------
//     // Base output filename
//     //
//     // pubmed_abstract-chemistal-set
//     // --------------------------------------------

//     const baseFileName =
//       `${safeSource}_${originalBaseName}`;

//     // --------------------------------------------
//     // Return result
//     // --------------------------------------------

//     return NextResponse.json({
//       ...result,

//       source,

//       originalFileName,

//       savedSourceFile:
//         sourceFileName,

//       baseFileName,

//       jsonFileName:
//         `${baseFileName}.json`,

//       csvFileName:
//         `${baseFileName}.csv`
//     });

//   } catch (error) {

//     console.error(
//       'Process API error:',
//       error
//     );

//     return NextResponse.json(
//       {
//         error:
//           'Unable to process the uploaded file.'
//       },
//       {
//         status: 500
//       }
//     );
//   }
// }