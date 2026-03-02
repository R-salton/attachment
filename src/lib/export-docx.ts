'use client';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface ReportData {
  reportTitle: string;
  reportDate: string;
  unit: string;
  fullText: string;
  reportingCommanderName: string;
  images?: string[];
}

/**
 * Strips HTML tags and Markdown formatting artifacts (###, *).
 */
function cleanTextForExport(text: string): string {
  if (!text) return "";
  
  let cleaned = text
    .replace(/<\/p>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/li>/g, '\n')
    .replace(/<li[^>]*>/g, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/###/g, '')
    .replace(/\*/g, '');

  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  return cleaned.trim();
}

function processLine(line: string): Paragraph {
  const content = line.trim();
  if (!content) return new Paragraph({ children: [] });

  const isBullet = content.startsWith('• ');
  const finalText = isBullet ? content.substring(2) : content;
  const isHeaderCandidate = content === content.toUpperCase() && content.length > 5;

  return new Paragraph({
    children: [
      new TextRun({
        text: finalText,
        bold: isHeaderCandidate,
        color: "000000",
        size: isHeaderCandidate ? 26 : 24,
        font: "Arial",
      }),
    ],
    bullet: isBullet ? { level: 0 } : undefined,
    spacing: { 
      before: isHeaderCandidate ? 300 : 120, 
      after: 120 
    },
    heading: isHeaderCandidate ? HeadingLevel.HEADING_3 : undefined,
  });
}

export async function exportReportToDocx(report: ReportData) {
  const processedText = cleanTextForExport(report.fullText);
  const lines = processedText.split('\n').filter(l => l.trim().length > 0);
  
  const bodyParagraphs: any[] = lines.map(line => processLine(line));

  // --- MEMO COVER PAGE ---
  const coverPage = [
    new Paragraph({
      children: [
        new TextRun({
          text: "OFFICE OF RWAMAGANA DPU",
          bold: true,
          size: 36,
          font: "Arial",
          color: "000000",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "MEMO",
          bold: true,
          size: 28,
          font: "Arial",
          underline: {},
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "To: OIC CADET", bold: true, size: 24, font: "Arial" })],
                  spacing: { before: 200, after: 200 },
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "From: OIC ATTACHMENT", bold: true, size: 24, font: "Arial" })],
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Date: ${report.reportDate}`, bold: true, size: 24, font: "Arial" })],
                  spacing: { after: 200 },
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } },
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Sir,", size: 24, font: "Arial" })],
      spacing: { before: 400, after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: report.reportTitle.toUpperCase(),
          bold: true,
          size: 26,
          font: "Arial",
          underline: {},
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1. This serves to submit to your office, cadet course intake 14/25-26 Field Training Exercise reports for the period of ${report.reportDate}.`,
          size: 24,
          font: "Arial",
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "2. Forwarded for your consideration and further guidance.", size: 24, font: "Arial" })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "3. Respectfully,", size: 24, font: "Arial" })],
      spacing: { after: 800 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "RANK: OC    NAMES: ", bold: true, size: 24, font: "Arial" }),
        new TextRun({ text: report.reportingCommanderName.toUpperCase(), bold: true, size: 24, font: "Arial" }),
        new TextRun({ text: "    APT: .........    SIGNATURE: ............", bold: true, size: 24, font: "Arial" }),
      ],
      spacing: { before: 1200 },
    }),
    new Paragraph({ children: [new TextRun({ text: "", break: 1 })], pageBreakBefore: true }),
  ];

  // --- EVIDENCE SECTION ---
  if (report.images && report.images.length > 0) {
    bodyParagraphs.push(new Paragraph({
      children: [new TextRun({ text: "ATTACHED OPERATIONAL EVIDENCE", bold: true, size: 26, font: "Arial", break: 2 })],
      spacing: { before: 400, after: 200 },
    }));

    for (const imgUri of report.images) {
      try {
        const base64Parts = imgUri.split(',');
        if (base64Parts.length < 2) continue;
        const bytes = new Uint8Array(atob(base64Parts[1].replace(/\s/g, '')).split('').map(c => c.charCodeAt(0)));
        
        bodyParagraphs.push(new Paragraph({
          children: [new ImageRun({ data: bytes, transformation: { width: 500, height: 330 } })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
        }));
      } catch (e) {
        console.error("DOCX Image Error:", e);
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: [...coverPage, ...bodyParagraphs],
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${report.reportTitle.replace(/[/\\?%*:|"<>]/g, '-')}.docx`);
  } catch (error) {
    console.error("DOCX Packing Error:", error);
    throw error;
  }
}
