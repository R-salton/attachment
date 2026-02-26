
'use client';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Break } from 'docx';
import { saveAs } from 'file-saver';

interface ArticleData {
  cadetName: string;
  company: string;
  platoon: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
}

/**
 * Exports multiple articles grouped by Company to a .docx file.
 */
export async function exportMagazineToDocx(articles: ArticleData[]) {
  const companies = ['Alpha', 'Bravo', 'Charlie'];
  const children: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "CADET MAGAZINE CONTRIBUTIONS",
          bold: true,
          size: 36,
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
  ];

  for (const companyName of companies) {
    const companyArticles = articles.filter(a => a.company === companyName);
    
    if (companyArticles.length === 0) continue;

    // Company Header
    children.push(new Paragraph({
      children: [
        new TextRun({
          text: `${companyName.toUpperCase()} COMPANY`,
          bold: true,
          size: 28,
          font: "Arial",
          underline: {},
        }),
      ],
      spacing: { before: 400, after: 300 },
      heading: HeadingLevel.HEADING_1,
    }));

    for (const article of companyArticles) {
      // Cadet Bio Line
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: `Author: OC ${article.cadetName}`,
            bold: true,
            size: 24,
            font: "Arial",
          }),
          new TextRun({
            text: ` | Platoon: ${article.platoon}`,
            size: 22,
            font: "Arial",
          }),
        ],
        spacing: { before: 200, after: 100 },
      }));

      // Article Image if exists
      if (article.imageUrl) {
        try {
          const base64Data = article.imageUrl.split(',')[1].replace(/\s/g, '');
          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          children.push(new Paragraph({
            children: [
              new ImageRun({
                data: bytes,
                transformation: {
                  width: 200,
                  height: 200,
                },
              }),
            ],
            spacing: { before: 100, after: 200 },
          }));
        } catch (e) {
          console.error("Magazine Image Export Error:", e);
        }
      }

      // Content
      const contentLines = article.content.split('\n');
      for (const line of contentLines) {
        if (!line.trim()) continue;
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              size: 24,
              font: "Arial",
            }),
          ],
          spacing: { after: 120 },
        }));
      }

      // Separator
      children.push(new Paragraph({
        children: [new TextRun({ text: "__________________________________________________", color: "CCCCCC" })],
        spacing: { after: 400 },
      }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `CADET_MAGAZINE_DRAFT_${new Date().toISOString().split('T')[0]}.docx`);
}
