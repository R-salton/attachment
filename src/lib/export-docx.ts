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
 * Strips HTML tags and handles basic conversions like <p> to newlines.
 * Optimized for DOCX paragraph splitting.
 */
function cleanHtmlForExport(html: string): string {
  if (!html) return "";
  
  // Replace common block elements with newlines to preserve structure
  let cleaned = html
    .replace(/<\/p>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/li>/g, '\n')
    .replace(/<li[^>]*>/g, '. ') // Turn list items into bullet-style lines
    .replace(/<[^>]+>/g, '');   // Strip all other tags

  // Decode basic entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  return cleaned;
}

/**
 * Processes a line of text, handling '*' markers for bolding and ensuring all titles are bold and black.
 */
function processLine(line: string): Paragraph {
  const trimmed = line.trim();
  if (!trimmed) return new Paragraph({ text: "" });

  // Check if it's a bullet point
  const isBullet = trimmed.startsWith('. ');
  const content = isBullet ? trimmed.substring(2) : trimmed;

  // Detect if the entire line is specifically marked with * as a title/header
  const isMarkedHeader = content.startsWith('*') && content.endsWith('*');
  const cleanText = isMarkedHeader ? content.replace(/\*/g, '') : content;

  // Logic to determine if a line should be bold (Marked headers or all-caps lines)
  const shouldBeBold = isMarkedHeader || (cleanText === cleanText.toUpperCase() && cleanText.length > 3);

  return new Paragraph({
    children: [
      new TextRun({
        text: cleanText,
        bold: shouldBeBold,
        color: "000000", // Ensure Black
        size: shouldBeBold ? 26 : 24, // Slightly larger for headers
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

export async function exportReportToDocx(report: ReportData) {
  // Clean HTML if the report was saved in rich text format
  const isHtml = report.fullText.includes('<p>') || report.fullText.includes('class=');
  const processedText = isHtml ? cleanHtmlForExport(report.fullText) : report.fullText;
  
  const lines = processedText.split('\n').filter(l => l.trim().length > 0);
  
  const children = lines.map(line => processLine(line));

  // Add images to the document if they exist
  if (report.images && report.images.length > 0) {
    children.push(new Paragraph({
      children: [
        new TextRun({
          text: "ATTACHED MEDIA EVIDENCE",
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
        // Extract base64 content
        const base64Data = imgUri.split(',')[1];
        if (!base64Data) continue;
        
        // Convert to Uint8Array for docx library
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        children.push(new Paragraph({
          children: [
            new ImageRun({
              data: binaryData,
              transformation: {
                width: 450, // Standard width for A4
                height: 300,
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
        }));
      } catch (e) {
        console.warn("Failed to embed image in DOCX:", e);
      }
    }
  }

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
          // Official Document Header (Title)
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
          
          // Operational Metadata (Date & Unit)
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

          // Main Transcript Content
          ...children,

          // Formal Signature Block
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
                text: "Respectfully Signed",
                italics: true,
                size: 18,
                color: "444444",
                font: "Arial",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = report.reportTitle.replace(/[/\\?%*:|"<>]/g, '-');
  saveAs(blob, `${fileName}.docx`);
}
