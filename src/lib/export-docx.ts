'use client';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface BriefingDay {
  dayLabel: string;
  summary: string;
  keyIncidents: string[];
  images?: string[];
}

interface ReportData {
  reportTitle: string;
  reportDate: string;
  unit: string;
  fullText?: string;
  reportingCommanderName: string;
  images?: string[];
  // Structured fields for Overall Report
  executiveSummary?: string;
  dailyBriefings?: BriefingDay[];
  forceWideAchievements?: string[];
  operationalTrends?: string[];
  criticalChallenges?: string[];
  strategicRecommendations?: string[];
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

function createParagraph(text: string, options: { bold?: boolean, size?: number, italic?: boolean, bullet?: boolean, color?: string, alignment?: any, spacing?: any } = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: options.bold,
        italic: options.italic,
        size: options.size || 24,
        font: "Arial",
        color: options.color || "000000",
      }),
    ],
    bullet: options.bullet ? { level: 0 } : undefined,
    alignment: options.alignment,
    spacing: options.spacing || { before: 120, after: 120 },
  });
}

function createImageParagraph(imgUri: string, title: string) {
  try {
    const base64Parts = imgUri.split(',');
    if (base64Parts.length < 2) return null;
    const bytes = new Uint8Array(atob(base64Parts[1].replace(/\s/g, '')).split('').map(c => c.charCodeAt(0)));
    
    return [
      new Paragraph({
        children: [new ImageRun({ data: bytes, transformation: { width: 500, height: 330 } })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            italic: true,
            size: 18,
            font: "Arial",
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      }),
    ];
  } catch (e) {
    console.error("DOCX Image Error:", e);
    return null;
  }
}

export async function exportReportToDocx(report: ReportData) {
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
          text: `1. This serves to submit to your office, cadet course intake 14/25-26 Field Training Exercise ${report.reportTitle.toLowerCase()}.`,
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

  // --- CONTENT BUILDER ---
  let bodyParagraphs: any[] = [];

  if (report.executiveSummary) {
    bodyParagraphs.push(createParagraph("EXECUTIVE STRATEGIC SUMMARY", { bold: true, size: 28, spacing: { before: 400, after: 200 } }));
    bodyParagraphs.push(createParagraph(report.executiveSummary, { size: 24 }));
    bodyParagraphs.push(new Paragraph({ spacing: { after: 400 } }));
  }

  if (report.dailyBriefings && report.dailyBriefings.length > 0) {
    bodyParagraphs.push(createParagraph("CHRONOLOGICAL DAILY BRIEFINGS", { bold: true, size: 28, spacing: { before: 400, after: 200 } }));
    
    report.dailyBriefings.forEach((day, index) => {
      bodyParagraphs.push(createParagraph(day.dayLabel.toUpperCase(), { bold: true, size: 26, spacing: { before: 300, after: 150 }, color: "2563eb" }));
      bodyParagraphs.push(createParagraph(day.summary, { size: 24, italic: true }));
      
      if (day.keyIncidents.length > 0) {
        bodyParagraphs.push(createParagraph("Significant Incidents & Responses:", { bold: true, size: 22, spacing: { before: 150, after: 100 } }));
        day.keyIncidents.forEach(inc => {
          bodyParagraphs.push(createParagraph(inc, { size: 22, bullet: true }));
        });
      }

      // Contextual Images for this day
      if (day.images && day.images.length > 0) {
        day.images.forEach((img, imgIdx) => {
          const imgParagraphs = createImageParagraph(img, `EXHIBIT: ${day.dayLabel} - Operational Photo ${imgIdx + 1}`);
          if (imgParagraphs) bodyParagraphs.push(...imgParagraphs);
        });
      }
      
      bodyParagraphs.push(new Paragraph({ border: { bottom: { color: "EEEEEE", style: BorderStyle.SINGLE, size: 4 } }, spacing: { after: 300 } }));
    });
  }

  // Fallback for standard text if not structured
  if (report.fullText && !report.dailyBriefings) {
    const processedText = cleanTextForExport(report.fullText);
    processedText.split('\n').forEach(line => {
      if (line.trim()) bodyParagraphs.push(createParagraph(line.trim()));
    });
  }

  // --- STRATEGIC SECTIONS ---
  const addListSection = (title: string, list?: string[]) => {
    if (list && list.length > 0) {
      bodyParagraphs.push(createParagraph(title, { bold: true, size: 26, spacing: { before: 400, after: 200 } }));
      list.forEach(item => bodyParagraphs.push(createParagraph(item, { size: 24, bullet: true })));
    }
  };

  addListSection("FORCE-WIDE ACHIEVEMENTS", report.forceWideAchievements);
  addListSection("OBSERVED OPERATIONAL TRENDS", report.operationalTrends);
  addListSection("CRITICAL CHALLENGES", report.criticalChallenges);
  addListSection("STRATEGIC COMMAND RECOMMENDATIONS", report.strategicRecommendations);

  // --- EVIDENCE FALLBACK (If any left) ---
  if (report.images && report.images.length > 0 && !report.dailyBriefings) {
    bodyParagraphs.push(createParagraph("ATTACHED OPERATIONAL EVIDENCE", { bold: true, size: 26, spacing: { before: 400, after: 200 } }));
    report.images.forEach((img, idx) => {
      const imgParagraphs = createImageParagraph(img, `EXHIBIT: Operational Photo ${idx + 1}`);
      if (imgParagraphs) bodyParagraphs.push(...imgParagraphs);
    });
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
