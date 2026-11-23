'use client';

import { useMemo, useState } from 'react';
import ExcelJS from 'exceljs';

const SOURCES = [
  {
    value: 'pubmed',
    label: 'PubMed',
    description:
      'PubMed/MEDLINE-style copied text'
  },
  {
    value: 'europepmc',
    label: 'Europe PMC',
    description:
      'Europe PMC-style publication text'
  },
  {
    value: 'others',
    label: 'Others',
    description:
      'Generic publication text parser'
  }
];

const HISTORY_KEY =
  'publication-extractor-history';

// ----------------------------------------------------
// Create safe filename
// ----------------------------------------------------

function safeBaseName(filename) {

  if (!filename) {
    return 'publication';
  }

  return filename
    .replace(/\.txt$/i, '')
    .replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    )
    .replace(
      /_+/g,
      '_'
    );
}

// ----------------------------------------------------
// Create final filename
//
// PubMed +
// abstract-chemistal-set.txt
//
// → pubmed_abstract-chemistal-set
// ----------------------------------------------------

function createOutputBaseName(
  source,
  filename
) {

  const baseName =
    safeBaseName(filename);

  return `${source}_${baseName}`;
}

// ----------------------------------------------------
// Download helper
// ----------------------------------------------------

function downloadBlob(
  content,
  filename,
  type
) {

  const blob = new Blob(
    [content],
    {
      type
    }
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement('a');

  a.href = url;

  a.download = filename;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    500
  );
}

// ----------------------------------------------------
// CSV conversion
// ----------------------------------------------------

// function toCsv(rows) {

//   if (!rows.length) {
//     return '';
//   }

//   const columns = [
//     'article_number',
//     'source',
//     'journal',
//     'title',
//     'author',
//     'author_number',
//     'email',
//     'doi',
//     'pmid',
//     'author_count',
//     'email_count',
//     'authors'
//   ];

//   const escape = value => {

//     const text =
//       value == null
//         ? ''
//         : String(value);

//     return /[",\n\r]/.test(text)
//       ? `"${text.replaceAll(
//           '"',
//           '""'
//         )}"`
//       : text;
//   };

//   return [
//     columns.join(','),

//     ...rows.map(
//       row =>
//         columns
//           .map(
//             column =>
//               escape(
//                 row[column]
//               )
//           )
//           .join(',')
//     )

//   ].join('\n');
// }

// function toCsv(rows) {
//   if (!rows.length) return '';

//   const columns = [
//     'article_number',
//     'source',
//     'journal',
//     'title',
//     'author',
//     'author_number',
//     'email',
//     'doi',
//     'pmid',
//     'author_count',
//     'email_count',
//     'authors'
//   ];

//   const escape = value => {
//     const text = String(value ?? '');
//     return `"${text.replace(/"/g, '""')}"`;
//   };

//   return [
//     columns.map(escape).join(','),

//     ...rows.map(row =>
//       columns.map(column => {
//         if (column === 'email') {
//           const emails = String(row.email || '')
//             .split(/[;\n]+/)
//             .map(email => email.trim())
//             .filter(Boolean);

//           return escape(
//             emails.length
//               ? emails.join(';\n\n') + ';'
//               : ''
//           );
//         }

//         return escape(row[column]);
//       }).join(',')
//     )
//   ].join('\r\n');
// }

async function downloadExcel(rows,filename) {
  if (!rows.length) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Publications');

  const columns = [
    'article_number',
    'source',
    'journal',
    'title',
    'author',
    'author_number',
    'email',
    'doi',
    'pmid',
    'author_count',
    'email_count',
    'authors'
  ];

  const widths = {
    article_number: 14,
    source: 15,
    journal: 22,
    title: 60,
    author: 30,
    author_number: 18,
    email: 42,
    doi: 35,
    pmid: 16,
    author_count: 15,
    email_count: 15,
    authors: 65
  };

  worksheet.columns = columns.map(key => ({
    header: key,
    key,
    width: widths[key]
  }));

  // Add one row per publication
  worksheet.addRows(rows);

  // Yellow header styling
  const header = worksheet.getRow(1);
  header.height = 25;

  header.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }
    };

    cell.font = {
      bold: true,
      color: { argb: 'FF000000' }
    };

    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
  });

  // Wrap all data cells and allow Excel to auto-fit row height
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

  worksheet.views = [
    { state: 'frozen', ySplit: 1 }
  ];

  worksheet.autoFilter = {
    from: 'A1',
    to: `${String.fromCharCode(64 + columns.length)}1`
  };

  // Generate XLSX file
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
const link = document.createElement('a');

link.href = url;
link.download = filename;

document.body.appendChild(link);
link.click();
link.remove();

URL.revokeObjectURL(url);
}



// ----------------------------------------------------
// Component
// ----------------------------------------------------

export default function ExtractorForm() {

  const [file, setFile] =
    useState(null);

  const [source, setSource] =
    useState('pubmed');

  const [format, setFormat] =
    useState('xlsx');

  const [rows, setRows] =
    useState([]);

  const [stats, setStats] =
    useState(null);

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [savedSourceFile, setSavedSourceFile] =
    useState('');

  const [outputBaseName, setOutputBaseName] =
    useState('');

  const sourceInfo =
    useMemo(
      () =>
        SOURCES.find(
          item =>
            item.value === source
        ),
      [source]
    );

  // --------------------------------------------------
  // Preview filename
  // --------------------------------------------------

  const generatedTxtName =
    file
      ? `${source}_${safeBaseName(file.name)}.txt`
      : '';

  // --------------------------------------------------
  // File change
  // --------------------------------------------------

  function handleFileChange(event) {

    const selectedFile =
      event.target.files?.[0] || null;

    setFile(selectedFile);

    setRows([]);

    setStats(null);

    setError('');

    setSavedSourceFile('');

    setOutputBaseName('');
  }

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

 
async function handleSubmit(event) {
  event.preventDefault();

  setError('');
  setRows([]);
  setStats(null);

  if (!file) {
    setError('Please select a TXT file.');
    return;
  }

  if (!file.name.toLowerCase().endsWith('.txt')) {
    setError('Please upload a .txt file.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('source', source);

  try {
    setLoading(true);

    const response = await fetch('/api/process', {
      method: 'POST',
      body: formData
    });

    // Read response as text first
    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Non-JSON server response:', responseText);

      throw new Error(
        `Server returned an invalid response (${response.status}): ${responseText.slice(0, 500)}`
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || `Processing failed (${response.status}).`
      );
    }

    setRows(data.rows || []);
    setStats(data.stats || null);

    setSavedSourceFile(
      data.savedSourceFile || generatedTxtName
    );

    setOutputBaseName(
      data.baseFileName ||
      createOutputBaseName(source, file.name)
    );

    if (!data.rows?.length) {
      setError(
        'No articles with an email address were found.'
      );
    }

  } catch (err) {
    console.error('Upload/processing error:', err);

    setError(
      err.message || 'Something went wrong.'
    );

  } finally {
    setLoading(false);
  }
}


  // --------------------------------------------------
  // Download
  // --------------------------------------------------

  
async function download() {
  if (!rows.length) return;

  const base =
    outputBaseName ||
    createOutputBaseName(source, file?.name);

  let filename;

  try {
    if (format === 'json') {
      filename = `${base}.json`;

      const content = JSON.stringify(
        {
          source,
          original_file: file?.name || '',
          saved_source_file: savedSourceFile || '',
          total_records: rows.length,
          records: rows
        },
        null,
        2
      );

      downloadBlob(
        content,
        filename,
        'application/json;charset=utf-8'
      );

    } else if (format === 'xlsx') {
      filename = `${base}.xlsx`;

      await downloadExcel(rows, filename);
    }

    // Save download history
    try {
      const existing = JSON.parse(
        localStorage.getItem(HISTORY_KEY) || '[]'
      );

      const next = [
        {
          id: crypto.randomUUID?.() || `${Date.now()}`,
          source,
          sourceLabel: sourceInfo?.label || source,
          outputFile: filename,
          originalFile: file?.name || '',
          savedSourceFile: savedSourceFile || generatedTxtName,
          records: rows.length,
          format,
          createdAt: new Date().toLocaleString()
        },
        ...existing
      ].slice(0, 50);

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(next)
      );
    } catch {
      // History must never block download
    }

  } catch (err) {
    console.error('Download error:', err);
    setError(`Download failed: ${err.message}`);
  }
}


  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (

    <section className="card">

      <form
        onSubmit={handleSubmit}
      >

        {/* ----------------------------------------- */}
        {/* Upload */}
        {/* ----------------------------------------- */}

        <div className="field">

          <label htmlFor="file">
            1. Upload TXT file
          </label>

          <input
            id="file"
            type="file"
            accept=".txt,text/plain"
            onChange={
              handleFileChange
            }
          />

          {file && (

            <div className="file-name">

              Selected:{' '}

              <strong>
                {file.name}
              </strong>

            </div>

          )}

          {file && (

            <div className="hint">

              Source copy/name:{' '}

              <strong>
                {generatedTxtName}
              </strong>

            </div>

          )}

        </div>

        {/* ----------------------------------------- */}
        {/* Source */}
        {/* ----------------------------------------- */}

        <div className="field">

          <label>
            2. Select source
          </label>

          <div className="source-grid">

            {SOURCES.map(
              item => (

                <label
                  key={item.value}
                  className={
                    `source-option ${
                      source ===
                      item.value
                        ? 'selected'
                        : ''
                    }`
                  }
                >

                  <input
                    type="radio"
                    name="source"
                    value={item.value}
                    checked={
                      source ===
                      item.value
                    }
                    onChange={
                      e =>
                        setSource(
                          e.target.value
                        )
                    }
                  />

                  <span>

                    <strong>
                      {item.label}
                    </strong>

                    <small>
                      {item.description}
                    </small>

                  </span>

                </label>

              )
            )}

          </div>

          <div className="hint">

            Only articles containing
            at least one email are kept.

            Each email becomes a
            separate output record and
            is matched by order to the
            author list.

          </div>

        </div>

        {/* ----------------------------------------- */}
        {/* Submit */}
        {/* ----------------------------------------- */}

        <button
          className="primary"
          disabled={loading}
          type="submit"
        >

          {loading
            ? 'Processing…'
            : 'Submit & Extract'}

        </button>

      </form>

      {/* ------------------------------------------- */}
      {/* Error */}
      {/* ------------------------------------------- */}

      {error && (

        <div className="alert">
          {error}
        </div>

      )}

      {/* ------------------------------------------- */}
      {/* Result */}
      {/* ------------------------------------------- */}

      {stats && (

        <div className="result-panel">

          <div className="stats stats-4">

            <div>

              <span>
                Total detected
              </span>

              <strong>
                {stats.totalDetected}
              </strong>

            </div>

            <div>

              <span>
                Articles with email
              </span>

              <strong>
                {stats.articlesWithEmail}
              </strong>

            </div>

            <div>

              <span>
                Output records
              </span>

              <strong>
                {stats.records}
              </strong>

            </div>

            <div>

              <span>
                Skipped
              </span>

              <strong>
                {stats.skipped}
              </strong>

            </div>

          </div>

          {/* --------------------------------------- */}
          {/* Download */}
          {/* --------------------------------------- */}

          {rows.length > 0 && (

            <>

              <div className="download-head">

                <div>

                  <h2>
                    Download formatted data
                  </h2>

                  <p>

                    {rows.length}
                    {' '}
                    email record(s) ready
                    {' · '}

                    source saved as{' '}

                    <strong>
                      {
                        savedSourceFile ||
                        generatedTxtName
                      }
                    </strong>

                  </p>

                  <p className="hint">

                    Output filename:{' '}

                    <strong>
                      {
                        outputBaseName ||
                        createOutputBaseName(
                          source,
                          file?.name
                        )
                      }
                    </strong>

                  </p>

                </div>

                <select
                  value={format}
                  onChange={
                    e =>
                      setFormat(
                        e.target.value
                      )
                  }
                  aria-label="Download format"
                >
                   <option value="xlsx">
                    Excel (.xlsx)
                  </option>
                  <option value="json">
                    JSON
                  </option>

                </select>

              </div>

              <button
                className="download"
                type="button"
                onClick={download}
              >

                Download{' '}
                {format.toUpperCase()}

              </button>

              {/* ----------------------------------- */}
              {/* Table */}
              {/* ----------------------------------- */}

              <div className="table-wrap">

                <table>

                  <thead>

                    <tr>

                      <th>
                        No.
                      </th>

                      <th>
                        Title
                      </th>

                      <th>
                        Author
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Author No.
                      </th>

                      <th>
                        DOI
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {rows
                      .slice(0, 50)
                      .map(
                        (
                          row,
                          index
                        ) => (

                          <tr
                            key={
                              `${row.article_number}-${row.email}-${index}`
                            }
                          >

                            <td>
                              {
                                row.article_number ||
                                '—'
                              }
                            </td>

                            <td>
                              {
                                row.title ||
                                '—'
                              }
                            </td>

                            <td>
                              {
                                row.author ||
                                '—'
                              }
                            </td>

                            <td>
                              {
                                row.email ||
                                '—'
                              }
                            </td>

                            <td>
                              {
                                row.author_number ||
                                '—'
                              }
                            </td>

                            <td>
                              {
                                row.doi ||
                                '—'
                              }
                            </td>

                          </tr>

                        )
                      )}

                  </tbody>

                </table>

              </div>

              {rows.length > 50 && (

                <p className="hint">

                  Preview shows the first
                  50 records. The download
                  contains all{' '}

                  {rows.length}

                  {' '}records.

                </p>

              )}

            </>

          )}

        </div>

      )}

    </section>
  );
}