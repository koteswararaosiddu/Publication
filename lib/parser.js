const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const DOI_RE = /\b10\.\d{4,9}\/[\-._;()/:A-Z0-9]+\b/i;
const PMID_RE = /\bPMID:\s*(\d+)/i;

function clean(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function splitArticleBlocks(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\u00a0/g, ' ');
  const starts = [...normalized.matchAll(/(?:^|\n)\s*(\d+)\.\s+(?=[^\n]*\b(?:19|20)\d{2}\b)/g)];
  const blocks = [];

  for (let i = 0; i < starts.length; i++) {
    const number = Number(starts[i][1]);
    const start = starts[i].index + starts[i][0].length;
    const end = i + 1 < starts.length ? starts[i + 1].index : normalized.length;
    let block = normalized.slice(start, end).trim();
    // PubMed copied text sometimes leaves the next display number at the end.
    block = block.replace(/\n\s*\d+\.\s*$/g, '').trim();
    if (block) blocks.push({ number, block });
  }

  if (!blocks.length && normalized.trim()) return [{ number: '', block: normalized.trim() }];
  return blocks;
}

function parseAuthorEntries(authorText) {
  const text = clean(authorText).replace(/\.$/, '');
  if (!text) return [];

  // Handles: Krukiewicz K(1), Zawisza P(2), Herman AP(3), ...
  const entries = [];
  const re = /([^,;]+?)\s*\((\d+(?:\s*,\s*\d+)*)\)(?=\s*[,;]|\s*$)/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    entries.push({
      name: clean(match[1]),
      author_numbers: match[2].split(',').map(n => Number(n.trim()))
    });
  }

  // Fallback for a plain author list without affiliation numbers.
  if (!entries.length) {
    return text.split(/\s*,\s*|\s*;\s*/).map(name => ({
      name: clean(name),
      author_numbers: []
    })).filter(x => x.name);
  }
  return entries;
}

function findAuthorLine(lines, title) {
  const titleIndex = lines.findIndex(line => line === title);
  const afterTitle = titleIndex >= 0 ? lines.slice(titleIndex + 1) : lines.slice(1);

  // Prefer the first line containing affiliation markers, which is the common PubMed form.
  const marked = afterTitle.find(line => /\(\d+(?:\s*,\s*\d+)*\)/.test(line));
  if (marked) return marked;

  // Otherwise, find a line before Author information that looks like an author list.
  return afterTitle.find(line => {
    if (!line || /^Author information:/i.test(line)) return false;
    const parts = line.split(/,\s*/);
    return parts.length >= 1 && parts.every(part => /^[^\d@]+$/.test(part));
  }) || '';
}
function extractEmailEntries(info) {
  const entries = [];

  const sections = info.split(/(?=^\s*\(\d+\))/m);

  for (const section of sections) {
    const numberMatch = section.match(/^\s*\((\d+)\)/);
    const authorNumber = numberMatch
      ? Number(numberMatch[1])
      : null;

    const emails = section.match(EMAIL_RE) || [];

    for (const email of emails) {
      entries.push({
        email: email.replace(/[.,;]+$/, ''),
        authorNumber
      });
    }
  }

  return entries;
}

function extractCountries(info) {
  if (!info) return '';

  const countryAliases = {
    USA: 'United States',
    'U.S.A.': 'United States',
    UK: 'United Kingdom',
    'U.K.': 'United Kingdom',
    England: 'United Kingdom',
    Scotland: 'United Kingdom',
    Wales: 'United Kingdom'
  };

  const affiliations = info.split(/(?=^\s*\(\d+\))/m);

  const countries = affiliations
    .map(affiliation => {
      const text = clean(affiliation);

      // Remove affiliation number and email addresses.
      const address = text
        .replace(/^\(\d+\)\s*/, '')
        .replace(EMAIL_RE, '')
        .replace(/\s+/g, ' ')
        .trim();

      const parts = address.split(',');

      if (!parts.length) return '';

      let country = parts[parts.length - 1]
        .replace(/[.;\s]+$/, '')
        .trim();

      return countryAliases[country] || country;
    })
    .filter(Boolean);

  return unique(countries).join('; ');
}

// function parseBlock({ number, block }, source) {
//   // const emailMatches = unique((block.match(EMAIL_RE) || []).map(e => e.replace(/[.,;]+$/, '')));
//   // // Core rule: article is discarded when it has no email anywhere in its block.
//   // if (!emailMatches.length) return null;

//   const doiMatch = block.match(DOI_RE);
//   const pmidMatch = block.match(PMID_RE);

//   const infoMatch = block.match(/\n\s*Author information:\s*/i);
//   const infoIndex = infoMatch ? infoMatch.index : -1;
//   const beforeInfo = infoIndex >= 0 ? block.slice(0, infoIndex) : block;
//   const info = infoIndex >= 0 ? block.slice(infoIndex).replace(/^\s*Author information:\s*/i, '') : '';
//   const country = extractCountries(info);
//   const lines = beforeInfo.split('\n').map(clean).filter(Boolean);
//   const citationLine = lines[0] || '';
//   const paragraphs = beforeInfo.split(/\n\s*\n+/).map(clean).filter(Boolean);

//   let title = '';
//   if (paragraphs.length >= 2) {
//     title = paragraphs[1];
//   } else {
//     title = lines[1] || '';
//   }

//   // Title can wrap over multiple lines in copied text.
//   if (/^\[.*\]$/.test(title)) title = title.slice(1, -1);
//   title = clean(title);

//   let authors = '';
//   if (paragraphs.length >= 3) authors = paragraphs[2];
//   if (!authors) authors = findAuthorLine(lines, title);
//   authors = clean(authors).replace(/^Authors?:\s*/i, '').replace(/\.$/, '');

//   const authorEntries = parseAuthorEntries(authors);
//   const emailEntries = extractEmailEntries(info);

//   if (!emailEntries.length) {
//     const fallbackEmails = unique(
//       (beforeInfo.match(EMAIL_RE) || [])
//         .map(email => email.replace(/[.,;]+$/, ''))
//     );
  
//     fallbackEmails.forEach(email => {
//       emailEntries.push({
//         email,
//         authorNumber: null
//       });
//     });
//   }
  
//   const emailMatches = unique(
//     emailEntries.map(entry => entry.email)
//   );
  
//   const emailAuthorNumbers = new Set(
//     emailEntries
//       .map(entry => entry.authorNumber)
//       .filter(number => number !== null)
//   );
  
//   if (!emailMatches.length) return null;
//   // Keep the email order from the source. In PubMed-style records, email order normally follows
//   // the corresponding author/affiliation sequence. We create one output record per email.
//   // const record = {
//   //   article_number: number,
//   //   source,
//   //   journal: clean((citationLine.match(/^(.+?)\.\s+\d{4}\b/) || [])[1] || ''),
//   //   title,
//   //   author: authorEntries.map(a => a.name).join('; '),
//   //   author_number: authorEntries
//   //     .map(a => a.author_numbers?.join(','))
//   //     .filter(Boolean)
//   //     .join('; '),
//   //   email: emailMatches.join(';\n\n') + ';',
//   //   doi: doiMatch ? doiMatch[0].replace(/[.,;]+$/, '') : '',
//   //   pmid: pmidMatch ? pmidMatch[1] : '',
//   //   author_count: authorEntries.length,
//   //   email_count: emailMatches.length,
//   //   authors: authorEntries.map(a => a.name).join('; ')
//   // };
//   const record = {
//     article_number: number,
//     source,
//     country,
  
//     journal: clean(
//       (citationLine.match(/^(.+?)\.\s+\d{4}\b/) || [])[1] || ''
//     ),
  
//     title,
  
//     // Keep ALL authors.
//     // Add affiliation numbers only to authors with emails.
//     author: authorEntries
//     .filter(author =>
//       author.author_numbers.some(number =>
//         emailAuthorNumbers.has(number)
//       )
//     )
//     .map(author =>
//       `${author.name}(${author.author_numbers.join(',')})`
//     )
//     .join('; '),
  
//     author_number: authorEntries
//       .map(author => author.author_numbers.join(','))
//       .filter(Boolean)
//       .join('; '),
  
//     email: emailMatches.join(';\n\n') + ';',
  
//     doi: doiMatch
//       ? doiMatch[0].replace(/[.,;]+$/, '')
//       : '',
  
//     pmid: pmidMatch ? pmidMatch[1] : '',
  
//     author_count: authorEntries.length,
//     email_count: emailMatches.length,
  
//     authors: authorEntries.map(author => author.name).join('; ')
//   };
  
//   return [record];
  
// }

function parseBlock({ number, block }, source) {
  const doiMatch = block.match(DOI_RE);
  const pmidMatch = block.match(PMID_RE);

  const infoMatch = block.match(/\n\s*Author information:\s*/i);
  const infoIndex = infoMatch ? infoMatch.index : -1;

  const beforeInfo = infoIndex >= 0 ? block.slice(0, infoIndex) : block;
  const info = infoIndex >= 0
    ? block.slice(infoIndex).replace(/^\s*Author information:\s*/i, '')
    : '';

  const country = extractCountries(info);

  const lines = beforeInfo.split('\n').map(clean).filter(Boolean);
  const citationLine = lines[0] || '';
  const paragraphs = beforeInfo.split(/\n\s*\n+/).map(clean).filter(Boolean);

  // Extract journal from the citation line.
  const journalMatch = citationLine.match(/^(.+?)\.\s+\d{4}\b/);
  const journal = journalMatch ? clean(journalMatch[1]) : '';

  // Extract title.
  let title = paragraphs.length >= 2 ? paragraphs[1] : (lines[1] || '');

  if (/^\[.*\]$/.test(title)) {
    title = title.slice(1, -1);
  }
  title = clean(title);

  // Extract authors.
  let authors = '';
  if (paragraphs.length >= 3) authors = paragraphs[2];
  if (!authors) authors = findAuthorLine(lines, title);

  authors = clean(authors)
    .replace(/^Authors?:\s*/i, '')
    .replace(/\.$/, '');

  const authorEntries = parseAuthorEntries(authors);
  const emailEntries = extractEmailEntries(info);

  if (!emailEntries.length) {
    const fallbackEmails = unique(
      (beforeInfo.match(EMAIL_RE) || [])
        .map(email => email.replace(/[.,;]+$/, ''))
    );

    fallbackEmails.forEach(email => {
      emailEntries.push({
        email,
        authorNumber: null
      });
    });
  }

  const emailMatches = unique(emailEntries.map(entry => entry.email));

  if (!emailMatches.length) return null;

  const doi = doiMatch
    ? doiMatch[0].replace(/[.,;]+$/, '')
    : '';

  const pmid = pmidMatch ? pmidMatch[1] : '';

  // Match emails to authors using affiliation numbers where available.
  const records = emailMatches.map(email => {
    const emailEntry = emailEntries.find(
      entry => entry.email.toLowerCase() === email.toLowerCase()
    );

    const author = emailEntry?.authorNumber !== null &&
      emailEntry?.authorNumber !== undefined
      ? authorEntries.find(entry =>
          entry.author_numbers.includes(emailEntry.authorNumber)
        )
      : null;

    return {
      article_number: number,
      source,
      journal,
      title,

      author: (author?.name || '')
        .replace(/\s*\(\d+\)/g, '')
        .trim(),

      author_number: emailEntry?.authorNumber ?? '',

      email: email.replace(/[;,\s]+$/, ''),

      doi,
      pmid,

      country,
      author_count: authorEntries.length,
      email_count: emailMatches.length,

      authors: authorEntries
        .map(entry => entry.name.replace(/\s*\(\d+\)/g, '').trim())
        .join('; ')
    };
  });

  return records;
}


export function parsePublicationText(text, source = 'others') {
  const blocks = splitArticleBlocks(text);
  const articleRecords = blocks.map(block => parseBlock(block, source)).filter(Boolean);
  const rows = articleRecords.flat();

  return {
    rows,
    stats: {
      totalDetected: blocks.length,
      articlesWithEmail: articleRecords.length,
      records: rows.length,
      skipped: blocks.length - articleRecords.length
    }
  };
}
