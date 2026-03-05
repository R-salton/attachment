'use client';

import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface BriefingDay {
  dayLabel: string;
  summary: string;
  keyIncidents: string[];
  images?: string[];
}

interface TacticalLogEntry {
  caseType: string;
  occurrences: string;
  actionTaken: string;
}

interface UnitStats {
  unitName: string;
  reportCount: number;
}

interface ReportData {
  reportTitle: string;
  reportDate: string;
  unit: string;
  fullText?: string;
  reportingCommanderName: string;
  images?: string[];
  executiveSummary?: string;
  operationalNarrative?: string;
  tacticalLog?: TacticalLogEntry[];
  dailyBriefings?: BriefingDay[];
  forceWideAchievements?: string[];
  operationalTrends?: string[];
  criticalChallenges?: string[];
  strategicRecommendations?: string[];
  unitBreakdown?: UnitStats[];
}

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

function createParagraph(text: string, options: { bold?: boolean, size?: number, italic?: boolean, bullet?: boolean, color?: string, alignment?: any, spacing?: any, underline?: boolean } = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: options.bold,
        italic: options.italic,
        size: options.size || 24,
        font: "Arial",
        color: options.color || "000000",
        underline: options.underline ? {} : undefined,
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
  const isOperationSummary = !report.dailyBriefings || report.dailyBriefings.length === 0;

  const coverPage = [
    new Paragraph({
      children: [new TextRun({ text: "OFFICE OF RWAMAGANA DPU", bold: true, size: 36, font: "Arial" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "MEMO", bold: true, size: 28, font: "Arial", underline: {} })],
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
              children: [new Paragraph({ children: [new TextRun({ text: "To: OIC CADET", bold: true, size: 24, font: "Arial" })], spacing: { before: 200, after: 200 } })],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: "From: OIC ATTACHMENT", bold: true, size: 24, font: "Arial" })], spacing: { before: 200, after: 100 } }),
                new Paragraph({ children: [new TextRun({ text: `Date: ${report.reportDate}`, bold: true, size: 24, font: "Arial" })], spacing: { after: 200 } }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }, spacing: { after: 400 } }),
    new Paragraph({ children: [new TextRun({ text: "Sir,", size: 24, font: "Arial" })], spacing: { before: 400, after: 200 } }),
    new Paragraph({
      children: [new TextRun({ text: report.reportTitle.toUpperCase(), bold: true, size: 26, font: "Arial", underline: {} })],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `1. This serves to submit to your office, cadet course intake 14/25-26 Field Training Exercise report for the specified period.`, size: 24, font: "Arial" })],
      spacing: { after: 200 },
    }),
    new Paragraph({ children: [new TextRun({ text: "2. Forwarded for your consideration and further guidance.", size: 24, font: "Arial" })], spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: "3. Respectfully,", size: 24, font: "Arial" })], spacing: { after: 800 } }),
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

  let bodyParagraphs: any[] = [];

  if (report.operationalNarrative || report.executiveSummary) {
    bodyParagraphs.push(createParagraph(isOperationSummary ? "OPERATIONAL ATTACHMENT NARRATIVE" : "EXECUTIVE STRATEGIC SUMMARY", { bold: true, size: 28, spacing: { before: 400, after: 200 }, underline: true }));
    bodyParagraphs.push(createParagraph(cleanTextForExport(report.operationalNarrative || report.executiveSummary || ""), { size: 24 }));
    bodyParagraphs.push(new Paragraph({ spacing: { after: 400 } }));
  }

  if (report.tacticalLog && report.tacticalLog.length > 0) {
    bodyParagraphs.push(createParagraph("TACTICAL CASE & RESOLUTION REGISTRY", { bold: true, size: 28, spacing: { before: 400, after: 200 }, underline: true }));
    
    report.tacticalLog.forEach(log => {
      bodyParagraphs.push(createParagraph(log.caseType.toUpperCase(), { bold: true, size: 26, color: "2563eb", spacing: { before: 300, after: 100 } }));
      bodyParagraphs.push(createParagraph(`Incident Details: ${cleanTextForExport(log.occurrences)}`, { size: 24, italic: true }));
      bodyParagraphs.push(createParagraph(`Command Resolution: ${cleanTextForExport(log.actionTaken)}`, { size: 24, bold: true, spacing: { after: 300 } }));
      bodyParagraphs.push(new Paragraph({ border: { bottom: { color: "EEEEEE", style: BorderStyle.SINGLE, size: 4 } }, spacing: { after: 200 } }));
    });
  }

  if (report.dailyBriefings && report.dailyBriefings.length > 0) {
    bodyParagraphs.push(createParagraph("CHRONOLOGICAL DAILY COMMAND BRIEFINGS", { bold: true, size: 28, spacing: { before: 400, after: 200 }, underline: true }));
    report.dailyBriefings.forEach((day) => {
      bodyParagraphs.push(createParagraph(day.dayLabel.toUpperCase(), { bold: true, size: 26, spacing: { before: 300, after: 150 }, color: "2563eb" }));
      bodyParagraphs.push(createParagraph(cleanTextForExport(day.summary), { size: 24, italic: true }));
      
      if (day.images && day.images.length > 0) {
        day.images.forEach((img, idx) => {
          const paragraphs = createImageParagraph(img, `EXHIBIT: ${day.dayLabel} - Tactical Media Photo ${idx + 1}`);
          if (paragraphs) bodyParagraphs.push(...paragraphs);
        });
      }
      bodyParagraphs.push(new Paragraph({ border: { bottom: { color: "EEEEEE", style: BorderStyle.SINGLE, size: 4 } }, spacing: { after: 300 } }));
    });
  }

  const addListSection = (title: string, list?: string[]) => {
    if (list && list.length > 0) {
      bodyParagraphs.push(createParagraph(title, { bold: true, size: 26, spacing: { before: 400, after: 200 }, underline: true }));
      list.forEach(item => bodyParagraphs.push(createParagraph(cleanTextForExport(item), { size: 24, bullet: true })));
    }
  };

  addListSection("FORCE-WIDE ACHIEVEMENTS", report.forceWideAchievements);
  addListSection("OBSERVED OPERATIONAL TRENDS", report.operationalTrends);
  addListSection("CRITICAL CHALLENGES ENCOUNTERED", report.criticalChallenges);
  addListSection("STRATEGIC COMMAND RECOMMENDATIONS", report.strategicRecommendations);

  // Breakdown Statistics Table
  if (report.unitBreakdown && report.unitBreakdown.length > 0) {
    bodyParagraphs.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })], pageBreakBefore: true }));
    bodyParagraphs.push(createParagraph("COMMAND STATISTICS REGISTRY", { bold: true, size: 28, spacing: { before: 400, after: 200 }, underline: true }));
    
    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DEPLOYMENT UNIT", bold: true, size: 22 })], alignment: AlignmentType.CENTER })], shading: { fill: "f1f5f9" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SITREP COUNT", bold: true, size: 22 })], alignment: AlignmentType.CENTER })], shading: { fill: "f1f5f9" } }),
        ],
      }),
      ...report.unitBreakdown.map(stat => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: stat.unitName, size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: stat.reportCount.toString(), size: 22 })], alignment: AlignmentType.CENTER })] }),
        ],
      }))
    ];

    bodyParagraphs.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows
    }));
  }

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: [...coverPage, ...bodyParagraphs] }],
  });

  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${report.reportTitle.substring(0, 50).replace(/[/\\?%*:|"<>]/g, '-')}.docx`);
  } catch (error) {
    console.error("DOCX Packing Error:", error);
    throw error;
  }
}
