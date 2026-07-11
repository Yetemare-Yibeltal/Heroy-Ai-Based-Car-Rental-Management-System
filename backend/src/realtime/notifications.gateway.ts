import PDFDocument from 'pdfkit';
import { Response } from 'express';

export function toCSV<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const escapeCell = (value: unknown): string => {
    const str = value === null || value === undefined ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.join(',');
  const dataLines = rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','));

  return [headerLine, ...dataLines].join('\n');
}

export function sendCSV<T extends Record<string, unknown>>(
  res: Response,
  filename: string,
  rows: T[]
): void {
  const csv = toCSV(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}

interface PdfTableColumn {
  header: string;
  key: string;
  width?: number;
}

interface GeneratePdfOptions {
  title: string;
  subtitle?: string;
  columns: PdfTableColumn[];
  rows: Record<string, unknown>[];
}

export function generateTablePdf(options: GeneratePdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(options.title, { align: 'left' });
    if (options.subtitle) {
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#666666').text(options.subtitle);
      doc.fillColor('#000000');
    }
    doc.moveDown(1);

    const startX = doc.x;
    let y = doc.y;
    const colWidth = options.columns.map((c) => c.width ?? 100);

    doc.fontSize(10).font('Helvetica-Bold');
    options.columns.forEach((col, i) => {
      const x = startX + colWidth.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(col.header, x, y, { width: colWidth[i] });
    });

    y += 18;
    doc
      .moveTo(startX, y)
      .lineTo(startX + colWidth.reduce((a, b) => a + b, 0), y)
      .stroke();
    y += 6;

    doc.font('Helvetica').fontSize(9);
    for (const row of options.rows) {
      if (y > 760) {
        doc.addPage();
        y = doc.y;
      }
      options.columns.forEach((col, i) => {
        const x = startX + colWidth.slice(0, i).reduce((a, b) => a + b, 0);
        const value = row[col.key];
        doc.text(value === null || value === undefined ? '-' : String(value), x, y, {
          width: colWidth[i],
        });
      });
      y += 16;
    }

    doc.end();
  });
}
