const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT = 48;
const TOP = 744;
const LINE_HEIGHT = 16;
const MAX_CHARS = 92;

const sanitize = (value) =>
  String(value ?? '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const escapePdfText = (value) =>
  sanitize(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const wrapLine = (line) => {
  const text = sanitize(line);
  if (text.length <= MAX_CHARS) return [text];

  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > MAX_CHARS) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
};

const paginate = (lines) => {
  const wrapped = lines.flatMap((line) => wrapLine(line));
  const pageCapacity = Math.floor((TOP - 48) / LINE_HEIGHT);
  const pages = [];

  for (let index = 0; index < wrapped.length; index += pageCapacity) {
    pages.push(wrapped.slice(index, index + pageCapacity));
  }

  return pages.length ? pages : [['No report data available.']];
};

const buildPageStream = (lines) => {
  const content = [
    'BT',
    '/F1 10 Tf',
    `${LEFT} ${TOP} Td`,
    '14 TL',
    ...lines.map((line) => `(${escapePdfText(line)}) Tj T*`),
    'ET',
  ].join('\n');

  return content;
};

exports.createSimplePdf = ({ title, subtitle, lines = [] }) => {
  const allLines = [
    title,
    subtitle,
    '',
    ...lines,
  ].filter((line) => line !== undefined && line !== null);

  const pages = paginate(allLines);
  const objects = [];
  const pageRefs = [];

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('');

  pages.forEach((pageLines) => {
    const content = buildPageStream(pageLines);
    const contentObjectId = objects.length + 1;
    objects.push(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`);

    const pageObjectId = objects.length + 1;
    pageRefs.push(`${pageObjectId} 0 R`);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> ` +
        `/Contents ${contentObjectId} 0 R >>`
    );
  });

  objects[1] = `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageRefs.length} >>`;

  let body = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body, 'latin1');
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  for (let index = 1; index < offsets.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(body, 'latin1');
};
