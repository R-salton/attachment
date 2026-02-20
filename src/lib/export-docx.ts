'use client';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface ReportData {
  reportTitle: string;
  reportDate: string;
  unit: string;
  fullText: string;
  reportingCommanderName: string;
}

export async function exportReportToDocx(report: ReportData) {
  const lines = report.fullText.split('\n');
  
  const children = lines.map((line) => {
    const trimmedLine = line.trim();
    
    // Bold Headers
    if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*')) {
      return new Paragraph({
        text: trimmedLine.replace(/\*/g, ''),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
      });
    }
    
    // Bullet points
    if (trimmedLine.startsWith('.')) {
      return new Paragraph({
        text: trimmedLine.substring(1).trim(),
        bullet: { level: 0 },
        spacing: { after: 120 },
      });
    }

    // Standard text
    return new Paragraph({
      children: [
        new TextRun({
          text: trimmedLine,
          bold: trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5,
        }),
      ],
      spacing: { after: 120 },
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: report.reportTitle,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...children,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${report.reportTitle.replace(/[/\\?%*:|"<>]/g, '-')}.docx`);
}
