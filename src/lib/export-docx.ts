'use client';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
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
 * Strips HTML tags and handles basic conversions.
 * Optimized for pure text extraction for DOCX.
 */
function cleanHtmlForExport(html: string): string {
  if (!html) return "";
  
  let cleaned = html
    .replace(/<\/p>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/li>/g, '\n')
    .replace(/<li[^>]*>/g, '• ') // Use a standard bullet character
    .replace(/<[^>]+>/g, '');

  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  return cleaned.trim();
}

/**
 * Creates a Paragraph for a line of text with proper formatting.
 */
function processLine(line: string): Paragraph {
  const content = line.trim();
  if (!content) return new Paragraph({ children: [] });

  const isMarkedHeader = content.startsWith('*') && content.endsWith('*');
  const cleanText = isMarkedHeader ? content.replace(/\*/g, '') : content;
  const isBullet = cleanText.startsWith('• ');
  const finalText = isBullet ? cleanText.substring(2) : cleanText;

  // Header detection: marked headers OR all-caps lines
  const shouldBeBold = isMarkedHeader || (cleanText === cleanText.toUpperCase() && cleanText.length > 3);

  return new Paragraph({
    children: [
      new TextRun({
        text: finalText,
        bold: shouldBeBold,
        color: "000000",
        size: shouldBeBold ? 26 : 24,
        font: "Arial",
      }),
    ],
    bullet: isBullet ? { level: 0 } : undefined,
    spacing: { 
      before: shouldBeBold ? 240 : 120, 
      after: 120 
    },
    heading: shouldBeBold ? HeadingLevel.HEADING_3 : undefined,
  });
}

/**
 * Exports report data to a pure .docx file.
 */
export async function exportReportToDocx(report: ReportData) {
  // Ensure we have a valid transcript
  const isHtml = report.fullText.includes('<p>') || report.fullText.includes('class=');
  const processedText = isHtml ? cleanHtmlForExport(report.fullText) : report.fullText;
  const lines = processedText.split('\n').filter(l => l.trim().length > 0);
  
  const children: any[] = lines.map(line => processLine(line));

  // Process and embed images if present
  if (report.images && report.images.length > 0) {
    children.push(new Paragraph({
      children: [
        new TextRun({
          text: "ATTACHED OPERATIONAL EVIDENCE",
          bold: true,
          color: "000000",
          size: 26,
          font: "Arial",
          break: 2
        }),
      ],
      spacing: { before: 400, after: 200 },
    }));

    for (const imgUri of report.images) {
      try {
        // Sanitize base64 string: remove header and any whitespace/newlines
        const base64Parts = imgUri.split(',');
        if (base64Parts.length < 2) continue;
        const base64Data = base64Parts[1].replace(/\s/g, '');
        
        // Convert to binary array safely
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        children.push(new Paragraph({
          children: [
            new ImageRun({
              data: bytes,
              transformation: {
                width: 500, // Balanced width for Word
                height: 330,
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
        }));
      } catch (e) {
        console.error("DOCX Image Processing Error:", e);
      }
    }
  }

  // Build document structure
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: report.reportTitle.toUpperCase(),
                bold: true,
                color: "000000",
                size: 32,
                font: "Arial",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          // Metadata
          new Paragraph({
            children: [
              new TextRun({ 
                text: `DATE: ${report.reportDate.toUpperCase()}`, 
                bold: true,
                color: "000000",
                size: 24,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: `UNIT: ${report.unit.toUpperCase()}`, 
                bold: true,
                color: "000000",
                size: 24,
                font: "Arial",
              }),
            ],
            spacing: { after: 400 },
          }),

          // Content body
          ...children,

          // Formal Signature
          new Paragraph({
            spacing: { before: 800 },
            children: [
              new TextRun({
                text: `OC ${report.unit}: OC ${report.reportingCommanderName}`,
                bold: true,
                allCaps: true,
                color: "000000",
                size: 24,
                font: "Arial",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Official Registry Record - Electronically Signed",
                italics: true,
                size: 18,
                color: "666666",
                font: "Arial",
              }),
            ],
          }),
        ],
      },
    ],
  });

  // Export as Blob and trigger download
  try {
    const blob = await Packer.toBlob(doc);
    const safeFileName = report.reportTitle.replace(/[/\\?%*:|"<>]/g, '-');
    saveAs(blob, `${safeFileName}.docx`);
  } catch (error) {
    console.error("DOCX Packing Error:", error);
    throw error;
  }
}
